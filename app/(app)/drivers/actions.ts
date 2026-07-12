"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RuleViolationError, toActionResult, type ActionResult } from "@/lib/errors";
import { assertRole, requireUser } from "@/lib/session";
import { createDriver, driverInput, setDriverStatus, updateDriver } from "@/lib/services/driverService";

export async function createDriverAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user, "SAFETY_OFFICER");
    const parsed = driverInput.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new RuleViolationError(parsed.error.issues[0].message);
    await createDriver(parsed.data);
    revalidatePath("/drivers");
  });
  if (result.ok) redirect("/drivers");
  return result;
}

export async function updateDriverAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user, "SAFETY_OFFICER");
    const parsed = driverInput.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new RuleViolationError(parsed.error.issues[0].message);
    await updateDriver(id, parsed.data);
    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
  });
  if (result.ok) redirect("/drivers");
  return result;
}

export async function setDriverStatusAction(
  id: string,
  status: "AVAILABLE" | "OFF_DUTY" | "SUSPENDED"
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user, "SAFETY_OFFICER");
    await setDriverStatus(id, status);
    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
  });
  return result;
}
