import Link from "next/link";
import { listTrips } from "@/lib/services/tripService";
import { requireUser } from "@/lib/session";
import { TRIP_STATUSES, canMutate, titleCase } from "@/lib/domain";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { ControlPanel, EmptyRow, ListView, PrimaryLink, StatusBadge, Td, Th } from "@/components/ui";

const TABS = ["All", ...TRIP_STATUSES] as const;

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const filters = await searchParams;
  const activeTab = filters.status ?? "All";
  const trips = await listTrips({ status: filters.status });

  return (
    <>
      <ControlPanel
        title="Trips"
        actions={canMutate(user.role, "trips") ? <PrimaryLink href="/trips/new">New</PrimaryLink> : undefined}
      />
      <div className="flex gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
        {TABS.map((tab) => {
          const isActive = tab === activeTab;
          const href = tab === "All" ? "/trips" : `/trips?status=${tab}`;
          return (
            <Link
              key={tab}
              href={href}
              className={`border-b-2 px-1 py-2 text-sm ${
                isActive ? "border-odoo text-odoo font-medium" : "border-transparent text-gray-500"
              }`}
            >
              {tab === "All" ? "All" : titleCase(tab)}
            </Link>
          );
        })}
      </div>
      <ListView>
        <thead>
          <tr>
            <Th>Route</Th>
            <Th>Vehicle</Th>
            <Th>Driver</Th>
            <Th right>Cargo (kg)</Th>
            <Th right>Planned (km)</Th>
            <Th right>Revenue</Th>
            <Th>Status</Th>
            <Th>Created</Th>
          </tr>
        </thead>
        <tbody>
          {trips.length === 0 && <EmptyRow colSpan={8} message="No trips match this filter." />}
          {trips.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <Td>
                <Link href={`/trips/${t.id}`} className="font-medium text-odoo-teal hover:underline">
                  {t.source} → {t.destination}
                </Link>
              </Td>
              <Td>
                {t.vehicle.name} ({t.vehicle.regNumber})
              </Td>
              <Td>{t.driver.name}</Td>
              <Td right>{formatNumber(t.cargoWeightKg)}</Td>
              <Td right>{formatNumber(t.plannedDistanceKm)}</Td>
              <Td right>{formatINR(t.revenue)}</Td>
              <Td>
                <StatusBadge status={t.status} />
              </Td>
              <Td>{formatDate(t.createdAt)}</Td>
            </tr>
          ))}
        </tbody>
      </ListView>
    </>
  );
}
