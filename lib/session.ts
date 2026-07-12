import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "./domain";
import { RuleViolationError } from "./errors";

const COOKIE_NAME = "transitops_session";
const isProduction = process.env.NODE_ENV === "production";

// In production a real SESSION_SECRET is mandatory — fail fast rather than
// signing sessions with a known dev key. Locally a stable fallback keeps the
// zero-config `npm run dev` experience.
if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in production.");
}
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
    secure: isProduction, // HTTPS-only once deployed; plain http for local dev
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
