"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { ErrorBanner, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

const DEMO_ACCOUNTS = [
  { role: "Fleet Manager", email: "fleet@transitops.in" },
  { role: "Driver (Dispatcher)", email: "dispatch@transitops.in" },
  { role: "Safety Officer", email: "safety@transitops.in" },
  { role: "Financial Analyst", email: "finance@transitops.in" },
];

export default function LoginPage() {
  const [state, action] = useActionState(login, null);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded bg-odoo text-lg font-black text-white">
            T
          </div>
          <h1 className="text-xl font-bold text-gray-800">TransitOps</h1>
          <p className="text-sm text-gray-500">Smart Transport Operations Platform</p>
        </div>

        <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
          {state && !state.ok && <ErrorBanner message={state.error} />}
          <form action={action} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-[13px] font-medium text-gray-600">Email</span>
              <input name="email" type="email" required className={inputClass} placeholder="you@company.in" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-medium text-gray-600">Password</span>
              <input name="password" type="password" required className={inputClass} placeholder="••••••••" />
            </label>
            <div className="pt-1">
              <SubmitButton>Log in</SubmitButton>
            </div>
          </form>
        </div>

        <div className="mt-4 rounded border border-gray-200 bg-white p-4 text-xs text-gray-600 shadow-sm">
          <div className="mb-2 font-semibold text-gray-700">Demo accounts (password: demo1234)</div>
          <ul className="space-y-1">
            {DEMO_ACCOUNTS.map((acc) => (
              <li key={acc.email} className="flex justify-between">
                <span>{acc.role}</span>
                <code className="text-odoo-teal">{acc.email}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
