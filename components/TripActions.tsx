"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/errors";
import { ErrorBanner, Field, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type BoundAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

export function TripActions({
  status,
  dispatchAction,
  completeAction,
  cancelAction,
}: {
  status: string;
  dispatchAction: BoundAction;
  completeAction: BoundAction;
  cancelAction: BoundAction;
}) {
  const [dispatchState, dispatchFormAction] = useActionState(dispatchAction, null);
  const [completeState, completeFormAction] = useActionState(completeAction, null);
  const [cancelState, cancelFormAction] = useActionState(cancelAction, null);

  if (status === "COMPLETED" || status === "CANCELLED") return null;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-8">
      {dispatchState && !dispatchState.ok && <ErrorBanner message={dispatchState.error} />}
      {completeState && !completeState.ok && <ErrorBanner message={completeState.error} />}
      {cancelState && !cancelState.ok && <ErrorBanner message={cancelState.error} />}

      <div className="flex flex-wrap items-end gap-3">
        {status === "DRAFT" && (
          <form action={dispatchFormAction}>
            <SubmitButton>Dispatch</SubmitButton>
          </form>
        )}

        {status === "DISPATCHED" && (
          <form action={completeFormAction} className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <Field label="Final Odometer (km)">
                <input name="endOdometerKm" type="number" step="any" min="0" required className={inputClass} />
              </Field>
            </div>
            <div className="w-40">
              <Field label="Fuel Consumed (L)">
                <input name="fuelConsumedL" type="number" step="any" min="0" required className={inputClass} />
              </Field>
            </div>
            <div className="w-40">
              <Field label="Fuel Cost (₹)">
                <input name="fuelCost" type="number" step="any" min="0" required className={inputClass} />
              </Field>
            </div>
            <SubmitButton>Complete Trip</SubmitButton>
          </form>
        )}

        <form action={cancelFormAction}>
          <SubmitButton variant="danger">Cancel Trip</SubmitButton>
        </form>
      </div>
    </div>
  );
}
