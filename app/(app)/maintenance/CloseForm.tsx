"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/lib/errors";
import { ErrorBanner, inputClass, filterInputClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export function CloseForm({
  action,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <div>
      <form action={formAction} className="flex items-center justify-end gap-2">
        <input
          name="cost"
          type="number"
          step="any"
          min="0"
          placeholder="Final cost ₹"
          className={`${filterInputClass} w-28`}
        />
        <SubmitButton variant="secondary">Close & Restore</SubmitButton>
      </form>
      {state && !state.ok && <ErrorBanner message={state.error} />}
    </div>
  );
}
