"use client";

import { useActionState } from "react";
import { ErrorBanner, Th, Td, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { importCsvAction } from "./actions";

export function ImportForm() {
  const [state, formAction] = useActionState(importCsvAction, null);

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-gray-600">Import Into</span>
          <select name="entity" defaultValue="vehicles" className={inputClass}>
            <option value="vehicles">Vehicles</option>
            <option value="drivers">Drivers</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-gray-600">CSV File</span>
          <input type="file" name="file" accept=".csv,text/csv" required className={inputClass} />
        </label>
        <SubmitButton>Import CSV</SubmitButton>
      </form>

      {state && "error" in state && <ErrorBanner message={state.error} />}

      {state && "results" in state && (
        <div className="mt-6">
          <p className="text-sm font-medium">
            <span className="text-green-700">{state.created} created</span>
            {" · "}
            <span className="text-amber-700">{state.skipped} skipped</span>
          </p>
          <div className="mt-3 overflow-x-auto rounded border border-gray-200">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr>
                  <Th>Row #</Th>
                  <Th>Identifier</Th>
                  <Th>Status</Th>
                  <Th>Reason</Th>
                </tr>
              </thead>
              <tbody>
                {state.results.map((r) => (
                  <tr key={r.row} className="hover:bg-gray-50">
                    <Td>{r.row}</Td>
                    <Td>{r.identifier}</Td>
                    <Td>
                      {r.status === "created" ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Created
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Skipped
                        </span>
                      )}
                    </Td>
                    <Td>{r.reason ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
