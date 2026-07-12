import { requireUser } from "@/lib/session";
import { ControlPanel, FormSheet } from "@/components/ui";
import { ImportForm } from "./ImportForm";

export default async function ImportPage() {
  await requireUser();

  return (
    <>
      <ControlPanel title="Spreadsheet Import" />
      <FormSheet>
        <p className="text-sm text-gray-600">
          Moving off spreadsheets? Upload your existing vehicle or driver logbook as CSV — every row is
          validated against the same business rules as the forms, and duplicates are skipped with a reason.
        </p>
        <div className="mt-5">
          <ImportForm />
        </div>
        <div className="mt-8 border-t border-gray-200 pt-4">
          <p className="text-[13px] font-medium text-gray-600">Sample files</p>
          <div className="mt-1.5 flex gap-4">
            <a
              href="/samples/vehicles-sample.csv"
              download
              className="text-sm text-odoo-teal hover:underline"
            >
              vehicles-sample.csv
            </a>
            <a
              href="/samples/drivers-sample.csv"
              download
              className="text-sm text-odoo-teal hover:underline"
            >
              drivers-sample.csv
            </a>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Column names are matched flexibly — &quot;Reg Number&quot;, &quot;reg_number&quot;, and
            &quot;regNumber&quot; all work.
          </p>
        </div>
      </FormSheet>
    </>
  );
}
