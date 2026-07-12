"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RuleViolationError, toActionResult, type ActionResult } from "@/lib/errors";
import { assertRole, requireUser } from "@/lib/session";
import { createVehicle, setVehicleRetired, updateVehicle, vehicleInput } from "@/lib/services/vehicleService";

export async function createVehicleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user, "FLEET_MANAGER");
    const parsed = vehicleInput.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new RuleViolationError(parsed.error.issues[0].message);
    await createVehicle(parsed.data);
    revalidatePath("/vehicles");
  });
  if (result.ok) redirect("/vehicles");
  return result;
}

export async function updateVehicleAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user, "FLEET_MANAGER");
    const parsed = vehicleInput.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new RuleViolationError(parsed.error.issues[0].message);
    await updateVehicle(id, parsed.data);
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
  });
  if (result.ok) redirect("/vehicles");
  return result;
}

export async function setVehicleRetiredAction(id: string, retired: boolean): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user, "FLEET_MANAGER");
    await setVehicleRetired(id, retired);
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
  });
  return result;
}

/** Form-compatible wrapper (forms expect a void action). */
export async function setVehicleRetiredFormAction(id: string, retired: boolean): Promise<void> {
  await setVehicleRetiredAction(id, retired);
}
