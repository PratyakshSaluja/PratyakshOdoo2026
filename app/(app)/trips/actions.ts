"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RuleViolationError, toActionResult, type ActionResult } from "@/lib/errors";
import { assertRole, requireUser } from "@/lib/session";
import {
  cancelTrip,
  completeTrip,
  completeTripInput,
  createTrip,
  dispatchTrip,
  tripInput,
} from "@/lib/services/tripService";

export async function createTripAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user, "DRIVER");
    const parsed = tripInput.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new RuleViolationError(parsed.error.issues[0].message);
    await createTrip(parsed.data);
    revalidatePath("/trips");
  });
  if (result.ok) redirect("/trips");
  return result;
}

export async function dispatchTripAction(
  id: string,
  _prev: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user, "DRIVER");
    await dispatchTrip(id);
    revalidatePath("/trips");
    revalidatePath(`/trips/${id}`);
    revalidatePath("/vehicles");
    revalidatePath("/drivers");
  });
  return result;
}

export async function completeTripAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user, "DRIVER");
    const parsed = completeTripInput.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new RuleViolationError(parsed.error.issues[0].message);
    await completeTrip(id, parsed.data);
    revalidatePath("/trips");
    revalidatePath(`/trips/${id}`);
    revalidatePath("/vehicles");
    revalidatePath("/drivers");
  });
  return result;
}

export async function cancelTripAction(
  id: string,
  _prev: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toActionResult(async () => {
    assertRole(user, "DRIVER");
    await cancelTrip(id);
    revalidatePath("/trips");
    revalidatePath(`/trips/${id}`);
    revalidatePath("/vehicles");
    revalidatePath("/drivers");
  });
  return result;
}
