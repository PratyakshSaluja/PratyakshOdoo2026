const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

export function formatINR(value: number): string {
  return inr.format(value);
}

export function formatNumber(value: number): string {
  return num.format(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startOfDay(value: Date | string): number {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Date-only comparison: a license expiring today is still valid today. */
export function isLicenseExpired(expiry: Date | string): boolean {
  return startOfDay(expiry) < startOfDay(new Date());
}

/** Whole days until expiry (date-only) — 0 = expires today, negative = expired. */
export function daysUntil(date: Date | string): number {
  return Math.round((startOfDay(date) - startOfDay(new Date())) / 86_400_000);
}
