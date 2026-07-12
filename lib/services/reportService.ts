import { prisma } from "@/lib/db";

export type DashboardFilters = { type?: string; status?: string; region?: string };

export async function dashboardKpis(filters: DashboardFilters = {}) {
  const vehicleWhere = {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.region ? { region: filters.region } : {}),
  };

  // Trip/maintenance KPIs are scoped through their vehicle (drivers have no
  // type/region, so Drivers On Duty stays fleet-wide).
  const tripVehicleScope = {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.region ? { region: filters.region } : {}),
  };

  const [vehicles, activeTrips, pendingTrips, driversOnDuty, openMaintenance] = await Promise.all([
    prisma.vehicle.findMany({ where: vehicleWhere, select: { status: true } }),
    prisma.trip.count({ where: { status: "DISPATCHED", vehicle: tripVehicleScope } }),
    prisma.trip.count({ where: { status: "DRAFT", vehicle: tripVehicleScope } }),
    prisma.driver.count({ where: { status: { in: ["AVAILABLE", "ON_TRIP"] } } }),
    prisma.maintenanceLog.count({ where: { status: "OPEN", vehicle: tripVehicleScope } }),
  ]);

  const activeFleet = vehicles.filter((v) => v.status !== "RETIRED");
  const onTrip = activeFleet.filter((v) => v.status === "ON_TRIP").length;

  return {
    activeVehicles: activeFleet.length,
    availableVehicles: activeFleet.filter((v) => v.status === "AVAILABLE").length,
    inMaintenance: activeFleet.filter((v) => v.status === "IN_SHOP").length,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    openMaintenance,
    utilizationPct: activeFleet.length ? Math.round((onTrip / activeFleet.length) * 100) : 0,
  };
}

export type VehicleReportRow = {
  regNumber: string;
  name: string;
  type: string;
  status: string;
  tripsCompleted: number;
  distanceKm: number;
  fuelLiters: number;
  fuelEfficiencyKmPerL: number | null;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  operationalCost: number;
  acquisitionCost: number;
  roiPct: number;
};

/**
 * Spec 3.8 —
 *   Fuel Efficiency = distance travelled / fuel consumed (completed trips)
 *   Operational Cost = Fuel + Maintenance
 *   ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
 */
export async function vehicleReport(): Promise<VehicleReportRow[]> {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: { where: { status: "COMPLETED" } },
      fuelLogs: true,
      maintenance: true,
    },
    orderBy: { name: "asc" },
  });

  return vehicles.map((v) => {
    const distanceKm = v.trips.reduce(
      (s, t) =>
        s + (t.endOdometerKm !== null && t.startOdometerKm !== null ? t.endOdometerKm - t.startOdometerKm : 0),
      0
    );
    const fuelLiters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
    const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintenanceCost = v.maintenance.reduce((s, m) => s + m.cost, 0);
    const revenue = v.trips.reduce((s, t) => s + t.revenue, 0);
    const operationalCost = fuelCost + maintenanceCost;

    return {
      regNumber: v.regNumber,
      name: v.name,
      type: v.type,
      status: v.status,
      tripsCompleted: v.trips.length,
      distanceKm,
      fuelLiters,
      fuelEfficiencyKmPerL: fuelLiters > 0 ? Math.round((distanceKm / fuelLiters) * 10) / 10 : null,
      revenue,
      fuelCost,
      maintenanceCost,
      operationalCost,
      acquisitionCost: v.acquisitionCost,
      roiPct: v.acquisitionCost > 0 ? Math.round(((revenue - operationalCost) / v.acquisitionCost) * 1000) / 10 : 0,
    };
  });
}

export function reportToCsv(rows: VehicleReportRow[]): string {
  const header = [
    "Reg Number",
    "Vehicle",
    "Type",
    "Status",
    "Trips Completed",
    "Distance (km)",
    "Fuel (L)",
    "Fuel Efficiency (km/L)",
    "Revenue",
    "Fuel Cost",
    "Maintenance Cost",
    "Operational Cost",
    "Acquisition Cost",
    "ROI (%)",
  ];
  const lines = rows.map((r) =>
    [
      r.regNumber,
      r.name,
      r.type,
      r.status,
      r.tripsCompleted,
      r.distanceKm,
      r.fuelLiters,
      r.fuelEfficiencyKmPerL ?? "",
      r.revenue,
      r.fuelCost,
      r.maintenanceCost,
      r.operationalCost,
      r.acquisitionCost,
      r.roiPct,
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.map((h) => `"${h}"`).join(","), ...lines].join("\n");
}
