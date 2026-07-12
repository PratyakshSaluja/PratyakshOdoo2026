import Link from "next/link";
import { listMaintenance } from "@/lib/services/maintenanceService";
import { requireUser } from "@/lib/session";
import { titleCase } from "@/lib/domain";
import { formatDate, formatINR } from "@/lib/format";
import { ControlPanel, EmptyRow, ListView, PrimaryLink, StatusBadge, Td, Th, inputClass, filterInputClass } from "@/components/ui";
import { closeMaintenanceAction } from "./actions";
import { CloseForm } from "./CloseForm";

const MAINTENANCE_STATUSES = ["OPEN", "CLOSED"] as const;

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireUser();
  const filters = await searchParams;
  const logs = await listMaintenance(filters);

  return (
    <>
      <ControlPanel
        title="Maintenance"
        actions={<PrimaryLink href="/maintenance/new">New</PrimaryLink>}
        right={
          <form className="flex items-center gap-2" method="get">
            <select name="status" defaultValue={filters.status ?? ""} className={`${filterInputClass} w-32`}>
              <option value="">All statuses</option>
              {MAINTENANCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Filter
            </button>
          </form>
        }
      />
      <ListView>
        <thead>
          <tr>
            <Th>Vehicle</Th>
            <Th>Job Title</Th>
            <Th>Notes</Th>
            <Th right>Cost</Th>
            <Th>Opened</Th>
            <Th>Closed</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && <EmptyRow colSpan={8} message="No maintenance logs match these filters." />}
          {logs.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50">
              <Td>
                <Link href={`/vehicles/${m.vehicleId}`} className="font-medium text-odoo-teal hover:underline">
                  {m.vehicle.name}
                </Link>
                <div className="text-xs text-gray-400">{m.vehicle.regNumber}</div>
              </Td>
              <Td>{m.title}</Td>
              <Td>
                {m.notes ? (
                  <span className="block max-w-[220px] truncate" title={m.notes}>
                    {m.notes}
                  </span>
                ) : (
                  "—"
                )}
              </Td>
              <Td right>{formatINR(m.cost)}</Td>
              <Td>{formatDate(m.openedAt)}</Td>
              <Td>{formatDate(m.closedAt)}</Td>
              <Td>
                <StatusBadge status={m.status} />
              </Td>
              <Td>{m.status === "OPEN" && <CloseForm action={closeMaintenanceAction.bind(null, m.id)} />}</Td>
            </tr>
          ))}
        </tbody>
      </ListView>
    </>
  );
}
