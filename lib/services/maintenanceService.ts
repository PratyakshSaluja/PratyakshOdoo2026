import { z } from "zod";
import { prisma } from "@/lib/db";
import { RuleViolationError } from "@/lib/errors";

export const maintenanceInput = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  title: z.string().trim().min(2, "Describe the maintenance job"),
  notes: z.string().trim().optional(),
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
});

export type MaintenanceInput = z.infer<typeof maintenanceInput>;

export function listMaintenance(filters?: { status?: string }) {
  return prisma.maintenanceLog.findMany({
    where: filters?.status ? { status: filters.status } : {},
    include: { vehicle: true },
    orderBy: { openedAt: "desc" },
  });
}

/** Vehicles eligible for a new maintenance log (not retired, not already in shop). */
export function maintainableVehicles() {
  return prisma.vehicle.findMany({
    where: { status: { in: ["AVAILABLE", "ON_TRIP"] } },
    orderBy: { name: "asc" },
  });
}

/** Rule 9: opening a maintenance log flips the vehicle to In Shop, atomically. */
export async function openMaintenance(input: MaintenanceInput) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new RuleViolationError("Vehicle not found.");
    if (vehicle.status === "RETIRED")
      throw new RuleViolationError("Retired vehicles cannot be sent for maintenance.");
    if (vehicle.status === "ON_TRIP")
      throw new RuleViolationError(
        `${vehicle.name} is on an active trip — complete or cancel the trip before opening maintenance.`
      );
    if (vehicle.status === "IN_SHOP")
      throw new RuleViolationError(`${vehicle.name} is already in the shop with an open maintenance log.`);

    await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: "IN_SHOP" } });
    return tx.maintenanceLog.create({ data: { ...input, status: "OPEN" } });
  });
}

/** Rule 10: closing maintenance restores the vehicle to Available (unless retired). */
export async function closeMaintenance(id: string, finalCost?: number) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findUnique({ where: { id }, include: { vehicle: true } });
    if (!log) throw new RuleViolationError("Maintenance log not found.");
    if (log.status === "CLOSED") throw new RuleViolationError("This maintenance log is already closed.");

    if (log.vehicle.status !== "RETIRED") {
      await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: "AVAILABLE" } });
    }
    return tx.maintenanceLog.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date(), ...(finalCost !== undefined ? { cost: finalCost } : {}) },
    });
  });
}
