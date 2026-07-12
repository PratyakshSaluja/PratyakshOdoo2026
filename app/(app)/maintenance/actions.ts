"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { RuleViolationError, toActionResult, type ActionResult } from "@/lib/errors";
import { assertRole, requireUser } from "@/lib/session";
import { closeMaintenance, maintenanceInput, openMaintenance } from "@/lib/services/maintenanceService";

/** Maintenance is Fleet-Manager-only — no extra roles are allowed through. */
export async function openMaintenanceAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user);
    const parsed = maintenanceInput.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new RuleViolationError(parsed.error.issues[0].message);
    await openMaintenance(parsed.data);
    revalidatePath("/maintenance");
    revalidatePath("/vehicles");
  });
  if (result.ok) redirect("/maintenance");
  return result;
}

export async function closeMaintenanceAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user);
    const rawCost = formData.get("cost");
    let finalCost: number | undefined;
    if (typeof rawCost === "string" && rawCost.trim() !== "") {
      const parsed = z.coerce.number().min(0).safeParse(rawCost);
      if (!parsed.success) throw new RuleViolationError("Enter a valid final cost (a number ≥ 0).");
      finalCost = parsed.data;
    }
    await closeMaintenance(id, finalCost);
    revalidatePath("/maintenance");
    revalidatePath("/vehicles");
  });
  return result;
}
