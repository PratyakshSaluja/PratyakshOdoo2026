import { requireUser } from "@/lib/session";
import { dashboardKpis, vehicleReport } from "@/lib/services/reportService";
import { titleCase } from "@/lib/domain";
import { formatINR, formatNumber } from "@/lib/format";
import { ControlPanel, EmptyRow, KpiCard, ListView, StatusBadge, Td, Th } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";

export default async function ReportsPage() {
  await requireUser();
  const [rows, kpis] = await Promise.all([vehicleReport(), dashboardKpis()]);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalOpCost = rows.reduce((s, r) => s + r.operationalCost, 0);
  const totalDistance = rows.reduce((s, r) => s + r.distanceKm, 0);
  const totalFuel = rows.reduce((s, r) => s + r.fuelLiters, 0);
  const fleetEfficiency = totalFuel > 0 ? Math.round((totalDistance / totalFuel) * 10) / 10 : null;

  const maxOperationalCost = Math.max(0, ...rows.map((r) => r.operationalCost));
  const maxFuelEfficiency = Math.max(0, ...rows.map((r) => r.fuelEfficiencyKmPerL ?? 0));

  return (
    <>
      <ControlPanel
        title="Reports & Analytics"
        right={
          <>
            <PrintButton />
            <a
              href="/reports/export"
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export CSV
            </a>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 p-4 sm:p-6 md:grid-cols-4">
        <KpiCard
          label="Fleet Utilization"
          value={`${kpis.utilizationPct}%`}
          sub="On Trip / active fleet"
          accent="plum"
        />
        <KpiCard label="Total Revenue" value={formatINR(totalRevenue)} sub="Completed trips" accent="green" />
        <KpiCard label="Operational Cost" value={formatINR(totalOpCost)} sub="Fuel + maintenance" accent="amber" />
        <KpiCard
          label="Fleet Fuel Efficiency"
          value={fleetEfficiency !== null ? `${fleetEfficiency} km/L` : "—"}
          sub="Distance / fuel, all vehicles"
        />
      </div>

      <ListView>
        <thead>
          <tr>
            <Th>Reg Number</Th>
            <Th>Vehicle</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th right>Trips</Th>
            <Th right>Distance (km)</Th>
            <Th right>Fuel (L)</Th>
            <Th right>Fuel Efficiency (km/L)</Th>
            <Th right>Revenue</Th>
            <Th right>Fuel Cost</Th>
            <Th right>Maintenance</Th>
            <Th right>Op. Cost</Th>
            <Th right>ROI %</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={13} message="No vehicles to report on." />}
          {rows.map((r) => (
            <tr key={r.regNumber} className="hover:bg-gray-50">
              <Td>{r.regNumber}</Td>
              <Td>{r.name}</Td>
              <Td>{titleCase(r.type)}</Td>
              <Td>
                <StatusBadge status={r.status} />
              </Td>
              <Td right>{r.tripsCompleted}</Td>
              <Td right>{formatNumber(r.distanceKm)}</Td>
              <Td right>{formatNumber(r.fuelLiters)}</Td>
              <Td right>{r.fuelEfficiencyKmPerL === null ? "—" : formatNumber(r.fuelEfficiencyKmPerL)}</Td>
              <Td right>{formatINR(r.revenue)}</Td>
              <Td right>{formatINR(r.fuelCost)}</Td>
              <Td right>{formatINR(r.maintenanceCost)}</Td>
              <Td right>
                <span className="font-medium">{formatINR(r.operationalCost)}</span>
              </Td>
              <Td right>
                <span
                  className={
                    r.roiPct > 0 ? "text-green-700" : r.roiPct < 0 ? "text-red-700" : undefined
                  }
                >
                  {r.roiPct}%
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </ListView>

      <div className="grid gap-4 px-4 pb-8 sm:px-6 md:grid-cols-2">
        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 text-xs font-semibold uppercase text-gray-500">Operational Cost per Vehicle</div>
          <div className="flex flex-col gap-2">
            {rows
              .filter((r) => r.operationalCost > 0)
              .map((r) => (
                <div key={r.regNumber} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-xs text-gray-600">{r.regNumber}</span>
                  <div className="h-4 flex-1 rounded bg-gray-100">
                    <div
                      className="h-4 rounded bg-odoo"
                      style={{ width: `${(r.operationalCost / maxOperationalCost) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs text-gray-600">{formatINR(r.operationalCost)}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 text-xs font-semibold uppercase text-gray-500">Fuel Efficiency (km/L)</div>
          <div className="flex flex-col gap-2">
            {rows
              .filter((r) => (r.fuelEfficiencyKmPerL ?? 0) > 0)
              .map((r) => (
                <div key={r.regNumber} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-xs text-gray-600">{r.regNumber}</span>
                  <div className="h-4 flex-1 rounded bg-gray-100">
                    <div
                      className="h-4 rounded bg-odoo-teal"
                      style={{ width: `${((r.fuelEfficiencyKmPerL ?? 0) / maxFuelEfficiency) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs text-gray-600">
                    {formatNumber(r.fuelEfficiencyKmPerL ?? 0)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
