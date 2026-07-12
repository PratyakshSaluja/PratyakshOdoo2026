import { z } from "zod";
import { prisma } from "@/lib/db";
import { REGIONS, VEHICLE_TYPES } from "@/lib/domain";
import { RuleViolationError } from "@/lib/errors";

export const vehicleInput = z.object({
  regNumber: z
    .string()
    .trim()
    .min(4, "Registration number looks too short")
    .transform((v) => v.toUpperCase().replace(/\s+/g, "")),
  name: z.string().trim().min(2, "Vehicle name is required"),
  type: z.enum(VEHICLE_TYPES),
  maxLoadKg: z.coerce.number().positive("Max load must be a positive number"),
  odometerKm: z.coerce.number().min(0, "Odometer cannot be negative"),
  acquisitionCost: z.coerce.number().positive("Acquisition cost must be positive"),
  region: z.enum(REGIONS),
});

export type VehicleInput = z.infer<typeof vehicleInput>;

export function listVehicles(filters?: { type?: string; status?: string; region?: string; q?: string }) {
  return prisma.vehicle.findMany({
    where: {
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.region ? { region: filters.region } : {}),
      ...(filters?.q
        ? { OR: [{ regNumber: { contains: filters.q } }, { name: { contains: filters.q } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getVehicle(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: {
      trips: { orderBy: { createdAt: "desc" }, include: { driver: true } },
      maintenance: { orderBy: { openedAt: "desc" } },
      fuelLogs: { orderBy: { date: "desc" } },
      expenses: { orderBy: { date: "desc" } },
    },
  });
}

/** Rule 1: registration number is unique (DB constraint backs this check). */
export async function createVehicle(input: VehicleInput) {
  const existing = await prisma.vehicle.findUnique({ where: { regNumber: input.regNumber } });
  if (existing) {
    throw new RuleViolationError(
      `Registration number ${input.regNumber} is already registered (${existing.name}).`,
      "DUPLICATE_REG"
    );
  }
  return prisma.vehicle.create({ data: input });
}

export async function updateVehicle(id: string, input: VehicleInput) {
  const clash = await prisma.vehicle.findUnique({ where: { regNumber: input.regNumber } });
  if (clash && clash.id !== id) {
    throw new RuleViolationError(
      `Registration number ${input.regNumber} is already registered (${clash.name}).`,
      "DUPLICATE_REG"
    );
  }
  return prisma.vehicle.update({ where: { id }, data: input });
}

/** Retire / reactivate with lifecycle guards. */
export async function setVehicleRetired(id: string, retired: boolean) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new RuleViolationError("Vehicle not found.");

  if (retired) {
    if (vehicle.status === "ON_TRIP")
      throw new RuleViolationError("Cannot retire a vehicle that is currently on a trip.");
    if (vehicle.status === "IN_SHOP")
      throw new RuleViolationError("Close the open maintenance log before retiring this vehicle.");
    return prisma.vehicle.update({ where: { id }, data: { status: "RETIRED" } });
  }

  if (vehicle.status !== "RETIRED")
    throw new RuleViolationError("Only retired vehicles can be reactivated.");
  return prisma.vehicle.update({ where: { id }, data: { status: "AVAILABLE" } });
}
