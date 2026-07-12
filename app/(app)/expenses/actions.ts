"use server";

import { revalidatePath } from "next/cache";
import { RuleViolationError, toActionResult, type ActionResult } from "@/lib/errors";
import { assertRole, requireUser } from "@/lib/session";
import { addExpense, addFuelLog, expenseInput, fuelLogInput } from "@/lib/services/expenseService";

export async function addFuelLogAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user, "FINANCIAL_ANALYST");
    const parsed = fuelLogInput.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new RuleViolationError(parsed.error.issues[0].message);
    await addFuelLog(parsed.data);
    revalidatePath("/expenses");
  });
  return result;
}

export async function addExpenseAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user, "FINANCIAL_ANALYST");
    const parsed = expenseInput.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new RuleViolationError(parsed.error.issues[0].message);
    await addExpense(parsed.data);
    revalidatePath("/expenses");
  });
  return result;
}
