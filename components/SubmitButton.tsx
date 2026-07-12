"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "bg-odoo text-white hover:bg-odoo-dark",
    secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
  };
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${styles[variant]}`}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
