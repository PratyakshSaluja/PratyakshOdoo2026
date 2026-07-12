"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/errors";
import { ErrorBanner, Field, FieldGrid, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type Option = { id: string; label: string };

export function TripForm({
  action,
  vehicles,
  drivers,
  submitLabel,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  vehicles: Option[];
  drivers: Option[];
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction}>
      {state && !state.ok && <ErrorBanner message={state.error} />}
      <FieldGrid>
        <Field label="Source *">
          <input name="source" required className={inputClass} placeholder="Mumbai" />
        </Field>
        <Field label="Destination *">
          <input name="destination" required className={inputClass} placeholder="Pune" />
        </Field>
        <Field label="Vehicle *">
          <select name="vehicleId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select a vehicle
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Only Available vehicles are listed — In-Shop and Retired vehicles are excluded.
          </p>
        </Field>
        <Field label="Driver *">
          <select name="driverId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select a driver
            </option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Only Available drivers with valid licenses are listed.
          </p>
        </Field>
        <Field label="Cargo Weight (kg) *">
          <input name="cargoWeightKg" type="number" step="any" min="0.01" required className={inputClass} />
        </Field>
        <Field label="Planned Distance (km) *">
          <input name="plannedDistanceKm" type="number" step="any" min="0.01" required className={inputClass} />
        </Field>
        <Field label="Revenue (₹) *">
          <input name="revenue" type="number" step="any" min="0" required className={inputClass} />
        </Field>
      </FieldGrid>
      <div className="mt-6 flex gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
