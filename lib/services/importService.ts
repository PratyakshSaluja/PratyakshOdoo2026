// Spreadsheet Import — the zero-friction migration path off logbooks.
// Reuses the exact same Zod schemas and create*() rules as the manual forms,
// so a bulk-imported fleet is held to the same standard as a hand-typed one.

import { parseCsv, pick, rowsToObjects } from "@/lib/csv";
import { RuleViolationError } from "@/lib/errors";
import { createDriver, driverInput } from "@/lib/services/driverService";
import { createVehicle, vehicleInput } from "@/lib/services/vehicleService";

export type ImportRowResult = {
  row: number;
  identifier: string;
  status: "created" | "skipped";
  reason?: string;
};

export type ImportReport = {
  entity: "vehicles" | "drivers";
  created: number;
  skipped: number;
  results: ImportRowResult[];
};

/** "north" / "NORTH" / "North" -> "North"; blank -> default "North". */
function normalizeRegion(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "North";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export async function importVehiclesCsv(text: string): Promise<ImportReport> {
  const objects = rowsToObjects(parseCsv(text));
  const results: ImportRowResult[] = [];
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const rowNumber = i + 1;
    const regNumber = pick(obj, "regnumber", "registrationnumber", "regno");
    const identifier = regNumber ?? `row ${rowNumber}`;

    const candidate = {
      regNumber,
      name: pick(obj, "name", "vehiclename", "model"),
      type: (pick(obj, "type") ?? "").toUpperCase(),
      maxLoadKg: pick(obj, "maxloadkg", "maxload", "capacity", "capacitykg"),
      odometerKm: pick(obj, "odometerkm", "odometer") ?? "0",
      acquisitionCost: pick(obj, "acquisitioncost", "cost", "price"),
      region: normalizeRegion(pick(obj, "region")),
    };

    const parsed = vehicleInput.safeParse(candidate);
    if (!parsed.success) {
      results.push({ row: rowNumber, identifier, status: "skipped", reason: parsed.error.issues[0].message });
      skipped++;
      continue;
    }

    try {
      await createVehicle(parsed.data);
      results.push({ row: rowNumber, identifier, status: "created" });
      created++;
    } catch (err) {
      if (err instanceof RuleViolationError) {
        results.push({ row: rowNumber, identifier, status: "skipped", reason: err.message });
        skipped++;
        continue;
      }
      throw err;
    }
  }

  return { entity: "vehicles", created, skipped, results };
}

export async function importDriversCsv(text: string): Promise<ImportReport> {
  const objects = rowsToObjects(parseCsv(text));
  const results: ImportRowResult[] = [];
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const rowNumber = i + 1;
    const licenseNumber = pick(obj, "licensenumber", "license", "licenseno");
    const identifier = licenseNumber ?? `row ${rowNumber}`;

    const candidate = {
      name: pick(obj, "name"),
      licenseNumber,
      licenseCategory: (pick(obj, "licensecategory", "category") ?? "LMV").toUpperCase(),
      licenseExpiry: pick(obj, "licenseexpiry", "expiry", "expirydate"),
      phone: pick(obj, "phone"),
      safetyScore: pick(obj, "safetyscore", "score") ?? "100",
    };

    const parsed = driverInput.safeParse(candidate);
    if (!parsed.success) {
      results.push({ row: rowNumber, identifier, status: "skipped", reason: parsed.error.issues[0].message });
      skipped++;
      continue;
    }

    try {
      await createDriver(parsed.data);
      results.push({ row: rowNumber, identifier, status: "created" });
      created++;
    } catch (err) {
      if (err instanceof RuleViolationError) {
        results.push({ row: rowNumber, identifier, status: "skipped", reason: err.message });
        skipped++;
        continue;
      }
      throw err;
    }
  }

  return { entity: "drivers", created, skipped, results };
}
