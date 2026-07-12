// Central domain vocabulary — SQLite has no enums, so these unions +
// the Zod schemas in each service are the single source of truth.

export const ROLES = ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver (Dispatcher)",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

export const VEHICLE_TYPES = ["TRUCK", "VAN", "BIKE"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_STATUSES = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const DRIVER_STATUSES = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const TRIP_STATUSES = ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const LICENSE_CATEGORIES = ["LMV", "HMV", "MCWG"] as const;

export const EXPENSE_CATEGORIES = ["TOLL", "PARKING", "REPAIR", "OTHER"] as const;

export const REGIONS = ["North", "South", "East", "West"] as const;

export type MutationArea =
  | "vehicles"
  | "drivers"
  | "trips"
  | "maintenance"
  | "expenses"
  | "import"
  | "sync"
  | "users";

/**
 * UX-honesty gate mirroring the server-side `assertRole` checks — the
 * server actions are the real enforcement, this only decides whether to
 * render the mutation controls at all. Fleet Manager can do everything;
 * other roles are scoped to their own area.
 */
export function canMutate(role: Role, area: MutationArea): boolean {
  if (role === "FLEET_MANAGER") return true;
  switch (area) {
    case "trips":
      return role === "DRIVER";
    case "drivers":
      return role === "SAFETY_OFFICER";
    case "expenses":
      return role === "FINANCIAL_ANALYST";
    default:
      return false;
  }
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
