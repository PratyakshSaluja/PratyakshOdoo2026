"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ROLES } from "@/lib/domain";
import { RuleViolationError, toActionResult, type ActionResult } from "@/lib/errors";
import { assertRole, requireUser } from "@/lib/session";
import { createUser, createUserInput, setUserStatus, updateUserRole } from "@/lib/services/userService";

export async function createUserAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  return toActionResult(async () => {
    assertRole(user); // Fleet Manager only
    const parsed = createUserInput.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw new RuleViolationError(parsed.error.issues[0].message);
    await createUser(parsed.data);
    revalidatePath("/admin/users");
  });
}

export async function updateUserRoleAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  return toActionResult(async () => {
    assertRole(user);
    const role = z.enum(ROLES).parse(formData.get("role"));
    await updateUserRole(id, role);
    revalidatePath("/admin/users");
  });
}

export async function setUserStatusAction(
  id: string,
  status: "ACTIVE" | "INACTIVE",
  _prev: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  return toActionResult(async () => {
    assertRole(user);
    await setUserStatus(id, status, user.id);
    revalidatePath("/admin/users");
  });
}
