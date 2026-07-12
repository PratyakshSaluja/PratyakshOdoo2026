import Link from "next/link";
import type { SessionUser } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/domain";
import { logout } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/drivers", label: "Drivers" },
  { href: "/trips", label: "Trips" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/expenses", label: "Fuel & Expenses" },
  { href: "/reports", label: "Reports" },
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="bg-odoo text-white">
        <div className="flex h-12 items-center gap-1 px-4">
          <Link href="/dashboard" className="mr-4 flex items-center gap-2 text-[15px] font-bold">
            <span className="grid h-6 w-6 place-items-center rounded bg-white/15 text-xs font-black">
              T
            </span>
            TransitOps
          </Link>
          <nav className="flex items-center gap-0.5 overflow-x-auto text-[13px]">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded px-3 py-1.5 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-[13px]">
            <span className="hidden sm:inline">{user.name}</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">
              {ROLE_LABELS[user.role]}
            </span>
            <form action={logout}>
              <button className="rounded px-2 py-1 hover:bg-white/10" type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
