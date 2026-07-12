import Link from "next/link";
import { titleCase } from "@/lib/domain";

/* ------------------------------------------------------------------ */
/* Control panel — Odoo's breadcrumb + actions bar under the navbar    */
/* ------------------------------------------------------------------ */

export function ControlPanel({
  title,
  breadcrumb,
  actions,
  right,
}: {
  title: string;
  breadcrumb?: { href: string; label: string };
  actions?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-2.5 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          {breadcrumb && (
            <Link href={breadcrumb.href} className="text-xs text-odoo-teal hover:underline">
              {breadcrumb.label}
            </Link>
          )}
          <h1 className="text-lg font-medium text-gray-800">{title}</h1>
        </div>
        {actions}
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </div>
    </div>
  );
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded bg-odoo px-3 py-1.5 text-sm font-medium text-white hover:bg-odoo-dark disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded bg-odoo px-3 py-1.5 text-sm font-medium text-white hover:bg-odoo-dark"
    >
      {children}
    </Link>
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* List view                                                           */
/* ------------------------------------------------------------------ */

export function ListView({ children }: { children: React.ReactNode }) {
  return (
    <div className="m-4 overflow-x-auto rounded border border-gray-200 bg-white shadow-sm sm:m-6">
      <table className="w-full min-w-[640px] text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 ${right ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <td className={`border-b border-gray-100 px-4 py-2 ${right ? "text-right" : "text-left"}`}>
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-gray-400">
        {message}
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Status badges                                                       */
/* ------------------------------------------------------------------ */

const BADGE_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  CLOSED: "bg-green-100 text-green-800",
  ON_TRIP: "bg-blue-100 text-blue-800",
  DISPATCHED: "bg-blue-100 text-blue-800",
  IN_SHOP: "bg-amber-100 text-amber-800",
  OPEN: "bg-amber-100 text-amber-800",
  DRAFT: "bg-gray-200 text-gray-700",
  OFF_DUTY: "bg-gray-200 text-gray-700",
  RETIRED: "bg-gray-200 text-gray-500",
  SUSPENDED: "bg-red-100 text-red-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_COLORS[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {titleCase(status)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Form sheet — Odoo's white document card                             */
/* ------------------------------------------------------------------ */

export function FormSheet({
  children,
  header,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
}) {
  return (
    <div className="mx-auto my-4 max-w-4xl px-4 sm:my-6">
      <div className="rounded border border-gray-200 bg-white shadow-sm">
        {header && <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-6 py-3">{header}</div>}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">{children}</div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

const inputBase =
  "rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 focus:border-odoo focus:outline-none focus:ring-1 focus:ring-odoo";

export const inputClass = `w-full ${inputBase}`;

/** For inline filter bars — no w-full so explicit widths apply. */
export const filterInputClass = inputBase;

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard KPI card                                                  */
/* ------------------------------------------------------------------ */

export function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "blue" | "amber" | "plum";
}) {
  const accents = {
    green: "text-green-700",
    blue: "text-blue-700",
    amber: "text-amber-700",
    plum: "text-odoo",
  };
  return (
    <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ? accents[accent] : "text-gray-800"}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}
