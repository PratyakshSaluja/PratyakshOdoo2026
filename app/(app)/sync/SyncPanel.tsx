"use client";

import { useActionState } from "react";
import { ErrorBanner, Td, Th } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { syncNowAction, type SyncActionState } from "./actions";

const PILL: Record<string, string> = {
  created: "bg-green-100 text-green-800",
  updated: "bg-blue-100 text-blue-800",
  skipped: "bg-amber-100 text-amber-800",
};

export function SyncPanel() {
  const [state, action] = useActionState<SyncActionState, FormData>(syncNowAction, null);

  return (
    <div>
      <form action={action} className="mb-4">
        <SubmitButton>Sync Now</SubmitButton>
      </form>

      {state && "error" in state && <ErrorBanner message={state.error} />}

      {state && !("error" in state) && (
        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">
            <span className="text-green-700">{state.created} created</span>
            {" · "}
            <span className="text-blue-700">{state.updated} updated</span>
            {" · "}
            <span className="text-amber-700">{state.skipped} skipped</span>
            {" · "}
            {state.pushedRows} rows pushed to the sheet
          </p>
          {state.results.length > 0 && (
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <Th>Sheet Row</Th>
                    <Th>Vehicle</Th>
                    <Th>Action</Th>
                    <Th>Reason</Th>
                  </tr>
                </thead>
                <tbody>
                  {state.results.map((r, i) => (
                    <tr key={i}>
                      <Td>{r.row}</Td>
                      <Td>{r.identifier}</Td>
                      <Td>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PILL[r.action]}`}>
                          {r.action}
                        </span>
                      </Td>
                      <Td>{r.reason ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {state.results.length === 0 && (
            <p className="text-sm text-gray-500">No changes pulled from the sheet — everything already in sync.</p>
          )}
        </div>
      )}
    </div>
  );
}
