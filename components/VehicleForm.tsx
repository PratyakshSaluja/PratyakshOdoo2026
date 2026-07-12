"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/errors";
import { REGIONS, VEHICLE_TYPES, titleCase } from "@/lib/domain";
import { ErrorBanner, Field, FieldGrid, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type Defaults = {
  regNumber?: string;
  name?: string;
  type?: string;
  maxLoadKg?: number;
  odometerKm?: number;
  acquisitionCost?: number;
  region?: string;
};

export function VehicleForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction}>
      {state && !state.ok && <ErrorBanner message={state.error} />}
      <FieldGrid>
        <Field label="Registration Number *">
          <input
            name="regNumber"
            required
            defaultValue={defaults.regNumber}
            className={inputClass}
            placeholder="MH12AB3344"
          />
        </Field>
        <Field label="Vehicle Name / Model *">
          <input
            name="name"
            required
            defaultValue={defaults.name}
            className={inputClass}
            placeholder="Tata Ace Gold"
          />
        </Field>
        <Field label="Type *">
          <select name="type" defaultValue={defaults.type ?? "TRUCK"} className={inputClass}>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {titleCase(t)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Max Load Capacity (kg) *">
          <input
            name="maxLoadKg"
            type="number"
            step="any"
            min="0.01"
            required
            defaultValue={defaults.maxLoadKg}
            className={inputClass}
          />
        </Field>
        <Field label="Odometer (km) *">
          <input
            name="odometerKm"
            type="number"
            step="any"
            min="0"
            required
            defaultValue={defaults.odometerKm}
            className={inputClass}
          />
        </Field>
        <Field label="Acquisition Cost (₹) *">
          <input
            name="acquisitionCost"
            type="number"
            step="any"
            min="0.01"
            required
            defaultValue={defaults.acquisitionCost}
            className={inputClass}
          />
        </Field>
        <Field label="Region *">
          <select name="region" defaultValue={defaults.region ?? "North"} className={inputClass}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
      </FieldGrid>
      <div className="mt-6 flex gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
