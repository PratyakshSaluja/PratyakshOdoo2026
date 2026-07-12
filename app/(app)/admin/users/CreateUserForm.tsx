"use client";

import { useActionState, useEffect, useRef } from "react";
import { ROLE_LABELS, ROLES } from "@/lib/domain";
import { ErrorBanner, Field, FieldGrid, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createUserAction } from "./actions";

export function CreateUserForm() {
  const [state, action] = useActionState(createUserAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action}>
      {state && !state.ok && <ErrorBanner message={state.error} />}
      {state?.ok && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Account created.
        </div>
      )}
      <FieldGrid>
        <Field label="Full Name *">
          <input name="name" required className={inputClass} placeholder="Asha Rao" />
        </Field>
        <Field label="Email *">
          <input name="email" type="email" required className={inputClass} placeholder="asha@company.in" />
        </Field>
        <Field label="Role *">
          <select name="role" defaultValue="DRIVER" className={inputClass}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Temporary Password * (min 8 chars)">
          <input name="password" type="text" required minLength={8} className={inputClass} placeholder="set-and-share" />
        </Field>
      </FieldGrid>
      <div className="mt-5">
        <SubmitButton>Create Account</SubmitButton>
      </div>
    </form>
  );
}
