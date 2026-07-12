import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { RuleViolationError } from "@/lib/errors";

type Tx = Prisma.TransactionClient;

export const tripInput = z.object({
  source: z.string().trim().min(2, "Source is required"),
  destination: z.string().trim().min(2, "Destination is required"),
  vehicleId: z.string().min(1, "Select a vehicle"),
  driverId: z.string().min(1, "Select a driver"),
  cargoWeightKg: z.coerce.number().positive("Cargo weight must be positive"),
  plannedDistanceKm: z.coerce.number().positive("Planned distance must be positive"),
  revenue: z.coerce.number().min(0, "Revenue cannot be negative"),
});

export type TripInput = z.infer<typeof tripInput>;

export const completeTripInput = z.object({
  endOdometerKm: z.coerce.number().positive("Enter the final odometer reading"),
  fuelConsumedL: z.coerce.number().positive("Enter fuel consumed in liters"),
  fuelCost: z.coerce.number().min(0, "Fuel cost cannot be negative"),
});

/** Rule 2: Retired / In-Shop vehicles never appear in the dispatch pool. */
export function dispatchableVehicles() {
  return prisma.vehicle.findMany({ where: { status: "AVAILABLE" }, orderBy: { name: "asc" } });
}

/** Rule 3: expired-license or suspended (or otherwise unavailable) drivers are not assignable. */
export function assignableDrivers() {
  return prisma.driver.findMany({
    where: { status: "AVAILABLE", licenseExpiry: { gte: new Date() } },
    orderBy: { name: "asc" },
  });
}

export function listTrips(filters?: { status?: string }) {
  return prisma.trip.findMany({
    where: filters?.status ? { status: filters.status } : {},
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getTrip(id: string) {
  return prisma.trip.findUnique({ where: { id }, include: { vehicle: true, driver: true } });
}

/**
 * Shared server-side assignment validation — rules 2, 3, 4 and 5.
 * Runs on create AND again inside the dispatch transaction, so the rules hold
 * even if fleet state changed between drafting and dispatching.
 */
async function validateAssignment(tx: Tx, vehicleId: string, driverId: string, cargoWeightKg: number) {
  const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new RuleViolationError("Selected vehicle no longer exists.");

  if (vehicle.status === "ON_TRIP")
    throw new RuleViolationError(`${vehicle.name} (${vehicle.regNumber}) is already on a trip.`); // rule 4
  if (vehicle.status === "IN_SHOP")
    throw new RuleViolationError(`${vehicle.name} (${vehicle.regNumber}) is in the shop for maintenance.`); // rule 2
  if (vehicle.status === "RETIRED")
    throw new RuleViolationError(`${vehicle.name} (${vehicle.regNumber}) is retired and cannot be dispatched.`); // rule 2

  const driver = await tx.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new RuleViolationError("Selected driver no longer exists.");

  if (driver.status === "ON_TRIP")
    throw new RuleViolationError(`${driver.name} is already on a trip.`); // rule 4
  if (driver.status === "SUSPENDED")
    throw new RuleViolationError(`${driver.name} is suspended and cannot be assigned.`); // rule 3
  if (driver.status === "OFF_DUTY")
    throw new RuleViolationError(`${driver.name} is off duty.`);
  if (driver.licenseExpiry < new Date())
    throw new RuleViolationError(
      `${driver.name}'s license expired on ${driver.licenseExpiry.toLocaleDateString("en-IN")}.`
    ); // rule 3

  if (cargoWeightKg > vehicle.maxLoadKg)
    throw new RuleViolationError(
      `Cargo weight ${cargoWeightKg} kg exceeds ${vehicle.name}'s maximum load capacity of ${vehicle.maxLoadKg} kg.`
    ); // rule 5

  return { vehicle, driver };
}

export async function createTrip(input: TripInput) {
  return prisma.$transaction(async (tx) => {
    await validateAssignment(tx, input.vehicleId, input.driverId, input.cargoWeightKg);
    return tx.trip.create({ data: { ...input, status: "DRAFT" } });
  });
}

/** Rule 6: dispatching flips vehicle + driver to On Trip, atomically. */
export async function dispatchTrip(id: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id } });
    if (!trip) throw new RuleViolationError("Trip not found.");
    if (trip.status !== "DRAFT")
      throw new RuleViolationError(`Only Draft trips can be dispatched (this one is ${trip.status}).`);

    const { vehicle } = await validateAssignment(tx, trip.vehicleId, trip.driverId, trip.cargoWeightKg);

    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "ON_TRIP" } });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: "ON_TRIP" } });
    return tx.trip.update({
      where: { id },
      data: { status: "DISPATCHED", dispatchedAt: new Date(), startOdometerKm: vehicle.odometerKm },
    });
  });
}

/**
 * Rule 7: completing restores vehicle + driver to Available, records the final
 * odometer on the vehicle and logs the fuel consumed as a FuelLog.
 */
export async function completeTrip(id: string, input: z.infer<typeof completeTripInput>) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id }, include: { vehicle: true } });
    if (!trip) throw new RuleViolationError("Trip not found.");
    if (trip.status !== "DISPATCHED")
      throw new RuleViolationError(`Only Dispatched trips can be completed (this one is ${trip.status}).`);

    const start = trip.startOdometerKm ?? trip.vehicle.odometerKm;
    if (input.endOdometerKm < start)
      throw new RuleViolationError(
        `Final odometer (${input.endOdometerKm} km) cannot be lower than the reading at dispatch (${start} km).`
      );

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "AVAILABLE", odometerKm: input.endOdometerKm },
    });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    await tx.fuelLog.create({
      data: {
        vehicleId: trip.vehicleId,
        tripId: trip.id,
        liters: input.fuelConsumedL,
        cost: input.fuelCost,
        note: `Trip ${trip.source} → ${trip.destination}`,
      },
    });
    return tx.trip.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        endOdometerKm: input.endOdometerKm,
        fuelConsumedL: input.fuelConsumedL,
      },
    });
  });
}

/** Rule 8: cancelling a dispatched trip restores both vehicle and driver. */
export async function cancelTrip(id: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id } });
    if (!trip) throw new RuleViolationError("Trip not found.");
    if (trip.status === "COMPLETED" || trip.status === "CANCELLED")
      throw new RuleViolationError(`A ${trip.status.toLowerCase()} trip cannot be cancelled.`);

    if (trip.status === "DISPATCHED") {
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    }
    return tx.trip.update({ where: { id }, data: { status: "CANCELLED" } });
  });
}
