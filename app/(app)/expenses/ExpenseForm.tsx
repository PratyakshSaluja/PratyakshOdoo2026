"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/errors";
import { EXPENSE_CATEGORIES, titleCase } from "@/lib/domain";
import { ErrorBanner, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type VehicleOption = { id: string; label: string };

export function ExpenseForm({
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
          <select name="vehicleId" required defaultValue="" className={`${inputClass} w-56`}>
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
          <span className="mb-1 block text-[13px] font-medium text-gray-600">Category *</span>
          <select name="category" required defaultValue={EXPENSE_CATEGORIES[0]} className={`${inputClass} w-32`}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {titleCase(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-gray-600">Amount (₹) *</span>
          <input name="amount" type="number" step="any" min="0.01" required className={`${inputClass} w-28`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-medium text-gray-600">Note</span>
          <input name="note" className={`${inputClass} w-48`} placeholder="Optional" />
        </label>
        <SubmitButton>Add Expense</SubmitButton>
      </div>
    </form>
  );
}
