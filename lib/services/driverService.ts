import { z } from "zod";
import { prisma } from "@/lib/db";
import { LICENSE_CATEGORIES } from "@/lib/domain";
import { RuleViolationError } from "@/lib/errors";

export const driverInput = z.object({
  name: z.string().trim().min(2, "Driver name is required"),
  licenseNumber: z
    .string()
    .trim()
    .min(6, "License number looks too short")
    .transform((v) => v.toUpperCase().replace(/\s+/g, "")),
  licenseCategory: z.enum(LICENSE_CATEGORIES),
  licenseExpiry: z.coerce.date(),
  phone: z.string().trim().min(10, "Enter a valid phone number"),
  safetyScore: z.coerce.number().int().min(0).max(100),
});

export type DriverInput = z.infer<typeof driverInput>;

export function listDrivers(filters?: { status?: string; q?: string }) {
  return prisma.driver.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.q
        ? { OR: [{ name: { contains: filters.q } }, { licenseNumber: { contains: filters.q } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getDriver(id: string) {
  return prisma.driver.findUnique({
    where: { id },
    include: { trips: { orderBy: { createdAt: "desc" }, include: { vehicle: true } } },
  });
}

export async function createDriver(input: DriverInput) {
  const existing = await prisma.driver.findUnique({ where: { licenseNumber: input.licenseNumber } });
  if (existing) {
    throw new RuleViolationError(
      `License number ${input.licenseNumber} is already registered to ${existing.name}.`,
      "DUPLICATE_LICENSE"
    );
  }
  return prisma.driver.create({ data: input });
}

export async function updateDriver(id: string, input: DriverInput) {
  const clash = await prisma.driver.findUnique({ where: { licenseNumber: input.licenseNumber } });
  if (clash && clash.id !== id) {
    throw new RuleViolationError(
      `License number ${input.licenseNumber} is already registered to ${clash.name}.`,
      "DUPLICATE_LICENSE"
    );
  }
  return prisma.driver.update({ where: { id }, data: input });
}

/** Off-duty / suspend / reinstate — never while on a trip. */
export async function setDriverStatus(id: string, status: "AVAILABLE" | "OFF_DUTY" | "SUSPENDED") {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new RuleViolationError("Driver not found.");
  if (driver.status === "ON_TRIP")
    throw new RuleViolationError(
      "This driver is on an active trip — complete or cancel the trip before changing their status."
    );
  return prisma.driver.update({ where: { id }, data: { status } });
}

/** Guarded hard delete — only for drivers with no trip history. */
export async function deleteDriver(id: string) {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: { _count: { select: { trips: true } } },
  });
  if (!driver) throw new RuleViolationError("Driver not found.");

  if (driver.status === "ON_TRIP")
    throw new RuleViolationError("Cannot delete a driver who is currently on a trip.");

  if (driver._count.trips > 0)
    throw new RuleViolationError(
      "This driver has trip history — suspend or set off duty instead."
    );

  return prisma.driver.delete({ where: { id } });
}
