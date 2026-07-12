import Link from "next/link";
import { requireUser } from "@/lib/session";
import { dashboardKpis } from "@/lib/services/reportService";
import { listTrips } from "@/lib/services/tripService";
import { listDrivers } from "@/lib/services/driverService";
import { REGIONS, VEHICLE_STATUSES, VEHICLE_TYPES, titleCase } from "@/lib/domain";
import { daysUntil, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { ControlPanel, EmptyRow, KpiCard, ListView, StatusBadge, Td, Th, inputClass, filterInputClass } from "@/components/ui";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; region?: string }>;
}) {
  await requireUser();
  const filters = await searchParams;

  const [kpis, activeTrips, drivers] = await Promise.all([
    dashboardKpis(filters),
    listTrips({ status: "DISPATCHED" }),
    listDrivers(),
  ]);

  const licenseAlerts = drivers
    .map((d) => ({ ...d, daysLeft: daysUntil(d.licenseExpiry) }))
    .filter((d) => d.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <>
      <ControlPanel
        title="Dashboard"
        right={
          <form className="flex flex-wrap items-center gap-2" method="get">
            <select name="type" defaultValue={filters.type ?? ""} className={`${filterInputClass} w-28`}>
              <option value="">All types</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={filters.status ?? ""} className={`${filterInputClass} w-32`}>
              <option value="">All statuses</option>
              {VEHICLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
            <select name="region" defaultValue={filters.region ?? ""} className={`${filterInputClass} w-28`}>
              <option value="">All regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
              Filter
            </button>
          </form>
        }
      />

      <div className="grid grid-cols-2 gap-4 p-4 sm:p-6 md:grid-cols-4">
        <KpiCard label="Active Vehicles" value={kpis.activeVehicles} sub="Excludes retired" />
        <KpiCard
          label="Available Vehicles"
          value={kpis.availableVehicles}
          sub="Ready to dispatch"
          accent="green"
        />
        <KpiCard label="In Maintenance" value={kpis.inMaintenance} sub="Currently in shop" accent="amber" />
        <KpiCard label="Active Trips" value={kpis.activeTrips} sub="Dispatched now" accent="blue" />
        <KpiCard label="Pending Trips" value={kpis.pendingTrips} sub="Drafted, not dispatched" />
        <KpiCard label="Drivers On Duty" value={kpis.driversOnDuty} sub="Available or on trip" />
        <KpiCard
          label="Fleet Utilization"
          value={`${kpis.utilizationPct}%`}
          sub="On Trip / active fleet"
          accent="plum"
        />
        <KpiCard label="Open Maintenance" value={kpis.openMaintenance} sub="Unresolved jobs" accent="amber" />
      </div>

      <h2 className="text-sm font-semibold text-gray-600 px-6">Active Trips</h2>
      <ListView>
        <thead>
          <tr>
            <Th>Route</Th>
            <Th>Vehicle</Th>
            <Th>Driver</Th>
            <Th right>Cargo (kg)</Th>
            <Th>Dispatched At</Th>
          </tr>
        </thead>
        <tbody>
          {activeTrips.length === 0 && <EmptyRow colSpan={5} message="No active trips right now." />}
          {activeTrips.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <Td>
                <Link href={`/trips/${t.id}`} className="text-odoo-teal hover:underline">
                  {t.source} → {t.destination}
                </Link>
              </Td>
              <Td>
                <Link href={`/vehicles/${t.vehicle.id}`} className="text-odoo-teal hover:underline">
                  {t.vehicle.name} ({t.vehicle.regNumber})
                </Link>
              </Td>
              <Td>
                <Link href={`/drivers/${t.driver.id}`} className="text-odoo-teal hover:underline">
                  {t.driver.name}
                </Link>
              </Td>
              <Td right>{formatNumber(t.cargoWeightKg)}</Td>
              <Td>{formatDateTime(t.dispatchedAt)}</Td>
            </tr>
          ))}
        </tbody>
      </ListView>

      <h2 className="text-sm font-semibold text-gray-600 px-6">License Alerts</h2>
      <ListView>
        <thead>
          <tr>
            <Th>Driver</Th>
            <Th>License No</Th>
            <Th>Expiry</Th>
            <Th>Alert</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {licenseAlerts.length === 0 && <EmptyRow colSpan={5} message="No license alerts." />}
          {licenseAlerts.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50">
              <Td>
                <Link href={`/drivers/${d.id}`} className="text-odoo-teal hover:underline">
                  {d.name}
                </Link>
              </Td>
              <Td>{d.licenseNumber}</Td>
              <Td>{formatDate(d.licenseExpiry)}</Td>
              <Td>
                {d.daysLeft <= 0 ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                    Expired {-d.daysLeft}d ago
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Expires in {d.daysLeft}d
                  </span>
                )}
              </Td>
              <Td>
                <StatusBadge status={d.status} />
              </Td>
            </tr>
          ))}
        </tbody>
      </ListView>
    </>
  );
}
