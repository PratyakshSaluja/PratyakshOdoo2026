"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/errors";
import { ErrorBanner, Field, FieldGrid, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export type VehicleOption = { id: string; label: string };

type Defaults = {
  vehicleId?: string;
  title?: string;
  notes?: string;
  cost?: number;
};

export function MaintenanceForm({
  action,
  vehicles,
  defaults = {},
  submitLabel,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  vehicles: VehicleOption[];
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction}>
      {state && !state.ok && <ErrorBanner message={state.error} />}
      <FieldGrid>
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-gray-600">Vehicle *</span>
          <select name="vehicleId" required defaultValue={defaults.vehicleId ?? ""} className={inputClass}>
            <option value="" disabled>
              Select a vehicle
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-gray-400">
            Opening a maintenance log automatically moves the vehicle to In Shop and removes it from dispatch.
          </span>
        </label>
        <Field label="Job Title *">
          <input
            name="title"
            required
            defaultValue={defaults.title}
            className={inputClass}
            placeholder="Brake pad replacement"
          />
        </Field>
        <Field label="Cost (₹)">
          <input
            name="cost"
            type="number"
            step="any"
            min="0"
            defaultValue={defaults.cost ?? 0}
            className={inputClass}
          />
        </Field>
      </FieldGrid>
      <div className="mt-4">
        <Field label="Notes">
          <textarea
            name="notes"
            rows={3}
            defaultValue={defaults.notes}
            className={inputClass}
            placeholder="Optional notes"
          />
        </Field>
      </div>
      <div className="mt-6 flex gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
