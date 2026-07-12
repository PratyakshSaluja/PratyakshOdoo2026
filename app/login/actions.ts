"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/lib/errors";
import { createSession, destroySession } from "@/lib/session";
import type { Role } from "@/lib/domain";

const loginInput = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

async function authenticate(email: string, password: string): Promise<ActionResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false, error: "Invalid email or password." };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Invalid email or password." };

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
  });
  redirect("/dashboard");
}

export async function login(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  return authenticate(parsed.data.email, parsed.data.password);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
