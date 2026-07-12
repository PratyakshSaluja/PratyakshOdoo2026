import { requireUser } from "@/lib/session";
import { isSyncConfigured, syncSpreadsheetUrl } from "@/lib/services/sheetSyncService";
import { ControlPanel, FormSheet } from "@/components/ui";
import { SyncPanel } from "./SyncPanel";

export default async function SyncPage() {
  await requireUser();
  const configured = isSyncConfigured();

  return (
    <>
      <ControlPanel
        title="Ops Sheet Bridge"
        right={
          configured ? (
            <a
              href={syncSpreadsheetUrl()}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Open Google Sheet
            </a>
          ) : undefined
        }
      />
      <FormSheet>
        <p className="mb-2 text-sm text-gray-600">
          Your ops team keeps their Google Sheet — TransitOps keeps the source of truth. One click
          pulls sheet edits into the app <em>through the same validation and business rules as the
          forms</em>, then pushes the authoritative fleet state back to the sheet.
        </p>
        <ul className="mb-5 list-disc pl-5 text-sm text-gray-600">
          <li>Edit a vehicle&apos;s Name, Type, Max Load, Reg Number or Region in the sheet → it updates here.</li>
          <li>Add a row without an ID → it becomes a new, fully validated vehicle (duplicates are skipped with a reason).</li>
          <li>Odometer and Status are app-owned — the sheet always reflects the app, never the other way.</li>
        </ul>
        {configured ? (
          <SyncPanel />
        ) : (
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium">Not configured on this machine.</p>
            <p className="mt-1">
              Set <code>GOOGLE_OAUTH_CLIENT_PATH</code>, <code>GOOGLE_SHEETS_TOKEN_PATH</code> and{" "}
              <code>SYNC_SPREADSHEET_ID</code> in <code>.env.local</code> (Google OAuth client +
              token JSON with the <code>spreadsheets</code> scope). The rest of the app is fully
              functional without it.
            </p>
          </div>
        )}
      </FormSheet>
    </>
  );
}
