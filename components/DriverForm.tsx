"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/errors";
import { LICENSE_CATEGORIES } from "@/lib/domain";
import { ErrorBanner, Field, FieldGrid, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type Defaults = {
  name?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiry?: Date | string;
  phone?: string;
  safetyScore?: number;
};

export function DriverForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, null);

  const licenseExpiryDefault = defaults.licenseExpiry
    ? new Date(defaults.licenseExpiry).toISOString().slice(0, 10)
    : undefined;

  return (
    <form action={formAction}>
      {state && !state.ok && <ErrorBanner message={state.error} />}
      <FieldGrid>
        <Field label="Driver Name *">
          <input
            name="name"
            required
            defaultValue={defaults.name}
            className={inputClass}
            placeholder="Ramesh Kumar"
          />
        </Field>
        <Field label="License Number *">
          <input
            name="licenseNumber"
            required
            defaultValue={defaults.licenseNumber}
            className={inputClass}
            placeholder="MH1420210012345"
          />
        </Field>
        <Field label="License Category *">
          <select name="licenseCategory" defaultValue={defaults.licenseCategory ?? "LMV"} className={inputClass}>
            {LICENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="License Expiry *">
          <input
            name="licenseExpiry"
            type="date"
            required
            defaultValue={licenseExpiryDefault}
            className={inputClass}
          />
        </Field>
        <Field label="Phone *">
          <input
            name="phone"
            required
            defaultValue={defaults.phone}
            className={inputClass}
            placeholder="9876543210"
          />
        </Field>
        <Field label="Safety Score (0-100) *">
          <input
            name="safetyScore"
            type="number"
            step="1"
            min="0"
            max="100"
            required
            defaultValue={defaults.safetyScore}
            className={inputClass}
          />
        </Field>
      </FieldGrid>
      <div className="mt-6 flex gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
