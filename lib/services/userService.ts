import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/domain";
import { RuleViolationError } from "@/lib/errors";

export const createUserInput = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(ROLES),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUserInput = z.infer<typeof createUserInput>;

export function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new RuleViolationError(`An account with ${input.email} already exists.`, "DUPLICATE_EMAIL");
  }
  const passwordHash = bcrypt.hashSync(input.password, 10);
  return prisma.user.create({
    data: { name: input.name, email: input.email, role: input.role, passwordHash },
  });
}

/** Prevent the org from locking itself out of Fleet-Manager administration. */
async function assertNotLastActiveFleetManager(userId: string, message: string) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== "FLEET_MANAGER" || target.status !== "ACTIVE") return;
  const activeFms = await prisma.user.count({ where: { role: "FLEET_MANAGER", status: "ACTIVE" } });
  if (activeFms <= 1) throw new RuleViolationError(message);
}

export async function updateUserRole(id: string, role: (typeof ROLES)[number]) {
  await assertNotLastActiveFleetManager(
    id,
    "This is the only active Fleet Manager — promote another before changing this role."
  );
  return prisma.user.update({ where: { id }, data: { role } });
}

export async function setUserStatus(id: string, status: "ACTIVE" | "INACTIVE", actingUserId: string) {
  if (id === actingUserId && status === "INACTIVE") {
    throw new RuleViolationError("You cannot deactivate your own account.");
  }
  if (status === "INACTIVE") {
    await assertNotLastActiveFleetManager(
      id,
      "This is the only active Fleet Manager — you cannot deactivate them."
    );
  }
  return prisma.user.update({ where: { id }, data: { status } });
}
