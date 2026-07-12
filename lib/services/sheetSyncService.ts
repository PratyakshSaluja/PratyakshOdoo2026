import fs from "node:fs";
import { prisma } from "@/lib/db";
import { REGIONS } from "@/lib/domain";
import { RuleViolationError } from "@/lib/errors";
import { createVehicle, updateVehicle, vehicleInput } from "./vehicleService";

/**
 * Ops Sheet Bridge — two-way sync between the vehicle registry and a Google
 * Sheet, for ops teams that still live in spreadsheets.
 *
 * Sync model (single user-triggered pass, echo-safe by construction):
 *   1. PULL  — sheet edits are validated through the same Zod schema + service
 *              rules as the forms. Rows with an ID update editable columns
 *              (Reg Number, Name, Type, Max Load, Region); rows without an ID
 *              are treated as new vehicles.
 *   2. PUSH  — the database (source of truth) is written back to the sheet,
 *              stamping IDs onto newly created rows.
 *   App-owned columns are never pulled: Odometer, Status (and Acquisition
 *   Cost for existing rows) always reflect the app.
 *
 * Configuration is env-based and optional — without it the feature simply
 * reports itself as not configured (see /sync).
 */

const clientPath = process.env.GOOGLE_OAUTH_CLIENT_PATH;
const tokenPath = process.env.GOOGLE_SHEETS_TOKEN_PATH;
const spreadsheetId = process.env.SYNC_SPREADSHEET_ID;

const TAB = "Vehicles";
const HEADERS = [
  "ID",
  "Reg Number",
  "Name",
  "Type",
  "Max Load (kg)",
  "Odometer (km)",
  "Acquisition Cost",
  "Region",
  "Status",
];

export function isSyncConfigured(): boolean {
  return Boolean(
    clientPath && tokenPath && spreadsheetId && fs.existsSync(clientPath) && fs.existsSync(tokenPath)
  );
}

export function syncSpreadsheetUrl(): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

async function accessToken(): Promise<string> {
  const client = JSON.parse(fs.readFileSync(clientPath!, "utf8")).installed;
  const tok = JSON.parse(fs.readFileSync(tokenPath!, "utf8"));
  const age = (Date.now() - (tok.obtained_at || 0)) / 1000;
  if (tok.access_token && age < (tok.expires_in || 3600) - 120) return tok.access_token;

  const body = new URLSearchParams({
    client_id: client.client_id,
    client_secret: client.client_secret,
    refresh_token: tok.refresh_token,
    grant_type: "refresh_token",
  });
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body });
  const fresh = await r.json();
  if (!fresh.access_token) throw new RuleViolationError("Google token refresh failed — reconnect the Sheet Bridge.");
  Object.assign(tok, fresh, { obtained_at: Date.now() });
  fs.writeFileSync(tokenPath!, JSON.stringify(tok, null, 2));
  return tok.access_token;
}

async function api(method: string, path: string, body?: unknown): Promise<string> {
  const token = await accessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  if (!res.ok) throw new RuleViolationError(`Google Sheets API error (HTTP ${res.status}).`);
  return text;
}

async function ensureTab(): Promise<void> {
  const meta = JSON.parse(await api("GET", "?fields=sheets(properties(title))"));
  const titles: string[] = (meta.sheets ?? []).map((s: { properties: { title: string } }) => s.properties.title);
  if (!titles.includes(TAB)) {
    await api("POST", ":batchUpdate", { requests: [{ addSheet: { properties: { title: TAB } } }] });
  }
}

function normalizeRegion(value: string): string | undefined {
  return REGIONS.find((r) => r.toLowerCase() === value.trim().toLowerCase());
}

export type SyncRowResult = {
  row: number;
  identifier: string;
  action: "created" | "updated" | "skipped";
  reason?: string;
};

export type SyncReport = {
  created: number;
  updated: number;
  skipped: number;
  pushedRows: number;
  results: SyncRowResult[];
  at: string;
};

export async function syncNow(): Promise<SyncReport> {
  if (!isSyncConfigured()) {
    throw new RuleViolationError("Sheet Bridge is not configured on this machine.");
  }
  await ensureTab();

  // ---- PULL: sheet → DB, through the same validation as the forms ----------
  const raw = JSON.parse(
    await api("GET", `/values/${encodeURIComponent(`${TAB}!A1:I2000`)}?valueRenderOption=UNFORMATTED_VALUE`)
  );
  const rows: unknown[][] = raw.values ?? [];
  const results: SyncRowResult[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cells = (rows[i] ?? []).map((c) => String(c ?? "").trim());
    const [id, reg, name, type, maxLoad, odo, cost, region] = [
      cells[0] ?? "", cells[1] ?? "", cells[2] ?? "", cells[3] ?? "",
      cells[4] ?? "", cells[5] ?? "", cells[6] ?? "", cells[7] ?? "",
    ];
    const rowNo = i + 1;
    if (!id && !reg) continue; // blank row

    if (id) {
      const existing = await prisma.vehicle.findUnique({ where: { id } });
      if (!existing) {
        results.push({ row: rowNo, identifier: reg || id, action: "skipped", reason: "Unknown ID — not in the app." });
        continue;
      }
      const parsed = vehicleInput.safeParse({
        regNumber: reg || existing.regNumber,
        name: name || existing.name,
        type: (type || existing.type).toUpperCase(),
        maxLoadKg: maxLoad !== "" ? maxLoad : existing.maxLoadKg,
        odometerKm: existing.odometerKm, // app-owned
        acquisitionCost: existing.acquisitionCost, // app-owned
        region: normalizeRegion(region) ?? existing.region,
      });
      if (!parsed.success) {
        results.push({ row: rowNo, identifier: existing.regNumber, action: "skipped", reason: parsed.error.issues[0].message });
        continue;
      }
      const changed =
        parsed.data.regNumber !== existing.regNumber ||
        parsed.data.name !== existing.name ||
        parsed.data.type !== existing.type ||
        parsed.data.maxLoadKg !== existing.maxLoadKg ||
        parsed.data.region !== existing.region;
      if (!changed) continue;
      try {
        await updateVehicle(existing.id, parsed.data);
        results.push({ row: rowNo, identifier: parsed.data.regNumber, action: "updated" });
      } catch (e) {
        if (e instanceof RuleViolationError) {
          results.push({ row: rowNo, identifier: parsed.data.regNumber, action: "skipped", reason: e.message });
        } else throw e;
      }
    } else {
      // New row authored directly in the sheet.
      const parsed = vehicleInput.safeParse({
        regNumber: reg,
        name,
        type: type.toUpperCase() || "TRUCK",
        maxLoadKg: maxLoad,
        odometerKm: odo === "" ? 0 : odo,
        acquisitionCost: cost,
        region: normalizeRegion(region) ?? "North",
      });
      if (!parsed.success) {
        results.push({ row: rowNo, identifier: reg || `row ${rowNo}`, action: "skipped", reason: parsed.error.issues[0].message });
        continue;
      }
      try {
        await createVehicle(parsed.data);
        results.push({ row: rowNo, identifier: parsed.data.regNumber, action: "created" });
      } catch (e) {
        if (e instanceof RuleViolationError) {
          results.push({ row: rowNo, identifier: parsed.data.regNumber, action: "skipped", reason: e.message });
        } else throw e;
      }
    }
  }

  // ---- PUSH: DB (source of truth) → sheet -----------------------------------
  const vehicles = await prisma.vehicle.findMany({ orderBy: { createdAt: "asc" } });
  const pushValues = [
    HEADERS,
    ...vehicles.map((v) => [
      v.id, v.regNumber, v.name, v.type, v.maxLoadKg, v.odometerKm, v.acquisitionCost, v.region, v.status,
    ]),
  ];
  await api("POST", `/values/${encodeURIComponent(`${TAB}!A1:I2000`)}:clear`);
  await api("PUT", `/values/${encodeURIComponent(`${TAB}!A1`)}?valueInputOption=RAW`, { values: pushValues });

  return {
    created: results.filter((r) => r.action === "created").length,
    updated: results.filter((r) => r.action === "updated").length,
    skipped: results.filter((r) => r.action === "skipped").length,
    pushedRows: vehicles.length,
    results,
    at: new Date().toISOString(),
  };
}
