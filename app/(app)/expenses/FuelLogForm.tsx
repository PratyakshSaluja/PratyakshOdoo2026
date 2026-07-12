"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/errors";
import { ErrorBanner, inputClass, filterInputClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type VehicleOption = { id: string; label: string };

export function FuelLogForm({
  action,
  vehicles,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  vehicles: VehicleOption[];
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="mb-4">
      {state && !state.ok && <ErrorBanner message={state.error} />}
      <div className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-gray-600">Vehicle *</span>
          <select name="vehicleId" required defaultValue="" className={`${filterInputClass} w-56`}>
            <option value="" disabled>
              Select a vehicle
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-gray-600">Liters *</span>
          <input name="liters" type="number" step="any" min="0.01" required className={`${filterInputClass} w-24`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-gray-600">Cost (₹) *</span>
          <input name="cost" type="number" step="any" min="0.01" required className={`${filterInputClass} w-28`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-gray-600">Note</span>
          <input name="note" className={`${filterInputClass} w-48`} placeholder="Optional" />
        </label>
        <SubmitButton>Add Fuel Log</SubmitButton>
      </div>
    </form>
  );
}
