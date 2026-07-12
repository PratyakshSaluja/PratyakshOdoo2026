// Business-rule failures are raised as typed errors by the service layer and
// converted to inline form feedback by server actions — never swallowed,
// never enforced only in the UI.

export class RuleViolationError extends Error {
  code: string;

  constructor(message: string, code = "RULE_VIOLATION") {
    super(message);
    this.name = "RuleViolationError";
    this.code = code;
  }
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/** Wrap a service call so server actions return a consistent envelope. */
export async function toActionResult(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (err) {
    if (err instanceof RuleViolationError) return { ok: false, error: err.message };
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return { ok: false, error: "That value must be unique — a record with it already exists." };
    }
    console.error(err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
