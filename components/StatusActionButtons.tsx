"use client";

import { useActionState, useEffect, useState } from "react";
import type { ActionResult } from "@/lib/errors";
import { ErrorBanner } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type BoundAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

export type StatusAction = {
  label: string;
  variant?: "secondary" | "danger";
  action: BoundAction;
};

/**
 * Reusable "one-off action button" group for detail-page control panels
 * (retire/reactivate, driver status changes, delete, ...). Each action gets
 * its own <form> + useActionState so failures surface inline instead of
 * being silently swallowed — mirrors components/TripActions.tsx, just
 * generalized to an arbitrary list of actions.
 *
 * Rules of Hooks: the number of actions is stable per page render, but we
 * still never call useActionState in a loop inside this component — each
 * action gets its own <SingleActionForm> child so each has its own hook.
 */
export function StatusActionButtons({ actions }: { actions: StatusAction[] }) {
  const [error, setError] = useState<string | undefined>(undefined);

  return (
    <div>
      <ErrorBanner message={error} />
      <div className="flex items-center gap-2">
        {actions.map((a, i) => (
          <SingleActionForm
            key={i}
            label={a.label}
            variant={a.variant}
            action={a.action}
            onResult={(result) => setError(result.ok ? undefined : result.error)}
          />
        ))}
      </div>
    </div>
  );
}

function SingleActionForm({
  label,
  variant,
  action,
  onResult,
}: StatusAction & { onResult: (result: ActionResult) => void }) {
  const [state, formAction] = useActionState(action, null);

  useEffect(() => {
    if (state) onResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction}>
      <SubmitButton variant={variant ?? "secondary"}>{label}</SubmitButton>
    </form>
  );
}
