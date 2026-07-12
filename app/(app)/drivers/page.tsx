import Link from "next/link";
import { listDrivers } from "@/lib/services/driverService";
import { requireUser } from "@/lib/session";
import { DRIVER_STATUSES, titleCase } from "@/lib/domain";
import { formatDate, isLicenseExpired, daysUntil } from "@/lib/format";
import { ControlPanel, EmptyRow, ListView, PrimaryLink, StatusBadge, Td, Th, inputClass } from "@/components/ui";

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireUser();
  const filters = await searchParams;
  const drivers = await listDrivers(filters);

  return (
    <>
      <ControlPanel
        title="Drivers"
        actions={<PrimaryLink href="/drivers/new">New</PrimaryLink>}
        right={
          <form className="flex flex-wrap items-center gap-2" method="get">
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Search name / license no."
              className={`${inputClass} w-48`}
            />
            <select name="status" defaultValue={filters.status ?? ""} className={`${inputClass} w-32`}>
              <option value="">All statuses</option>
              {DRIVER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
              Filter
            </button>
          </form>
        }
      />
      <ListView>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>License No</Th>
            <Th>Category</Th>
            <Th>License Expiry</Th>
            <Th>Phone</Th>
            <Th right>Safety Score</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {drivers.length === 0 && <EmptyRow colSpan={7} message="No drivers match these filters." />}
          {drivers.map((d) => {
            const expired = isLicenseExpired(d.licenseExpiry);
            const remaining = daysUntil(d.licenseExpiry);
            return (
              <tr key={d.id} className="hover:bg-gray-50">
                <Td>
                  <Link href={`/drivers/${d.id}`} className="font-medium text-odoo-teal hover:underline">
                    {d.name}
                  </Link>
                </Td>
                <Td>{d.licenseNumber}</Td>
                <Td>{d.licenseCategory}</Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    {formatDate(d.licenseExpiry)}
                    {expired ? (
                      <span className="inline-block whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                        Expired
                      </span>
                    ) : remaining <= 30 ? (
                      <span className="inline-block whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        Expires in {remaining}d
                      </span>
                    ) : null}
                  </span>
                </Td>
                <Td>{d.phone}</Td>
                <Td right>{d.safetyScore}</Td>
                <Td>
                  <StatusBadge status={d.status} />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </ListView>
    </>
  );
}
