import { z } from "zod";
import { prisma } from "@/lib/db";
import { EXPENSE_CATEGORIES } from "@/lib/domain";

export const fuelLogInput = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  liters: z.coerce.number().positive("Liters must be positive"),
  cost: z.coerce.number().positive("Cost must be positive"),
  note: z.string().trim().optional(),
});

export const expenseInput = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive("Amount must be positive"),
  note: z.string().trim().optional(),
});

export function listFuelLogs() {
  return prisma.fuelLog.findMany({ include: { vehicle: true }, orderBy: { date: "desc" } });
}

export function listExpenses() {
  return prisma.expense.findMany({ include: { vehicle: true }, orderBy: { date: "desc" } });
}

export function addFuelLog(input: z.infer<typeof fuelLogInput>) {
  return prisma.fuelLog.create({ data: input });
}

export function addExpense(input: z.infer<typeof expenseInput>) {
  return prisma.expense.create({ data: input });
}

/**
 * Spec 3.7: operational cost per vehicle = Fuel + Maintenance
 * (other logged expenses are reported as their own column).
 */
export async function vehicleCostSummaries() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      fuelLogs: { select: { cost: true, liters: true } },
      maintenance: { select: { cost: true } },
      expenses: { select: { amount: true } },
    },
    orderBy: { name: "asc" },
  });

  return vehicles.map((v) => {
    const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintenanceCost = v.maintenance.reduce((s, m) => s + m.cost, 0);
    const otherExpenses = v.expenses.reduce((s, e) => s + e.amount, 0);
    return {
      id: v.id,
      name: v.name,
      regNumber: v.regNumber,
      fuelCost,
      maintenanceCost,
      otherExpenses,
      operationalCost: fuelCost + maintenanceCost,
    };
  });
}
