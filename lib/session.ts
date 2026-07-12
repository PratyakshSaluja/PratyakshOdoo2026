import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "./domain";
import { RuleViolationError } from "./errors";

const COOKIE_NAME = "transitops_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "transitops-hackathon-dev-secret"
);

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/** Page/action guard — redirects unauthenticated users to login. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Mutation guard. Fleet Manager oversees the whole fleet, so it is allowed
 * everywhere; other roles must be explicitly listed.
 */
export function assertRole(user: SessionUser, ...allowed: Role[]): void {
  if (user.role === "FLEET_MANAGER") return;
  if (!allowed.includes(user.role)) {
    const requirement = allowed.length
      ? `requires ${allowed.join(" or ")}`
      : "restricted to the Fleet Manager";
    throw new RuleViolationError(`Your role does not permit this action (${requirement}).`, "FORBIDDEN");
  }
}
