"use server";

import { revalidatePath } from "next/cache";
import { RuleViolationError } from "@/lib/errors";
import { assertRole, requireUser } from "@/lib/session";
import { importDriversCsv, importVehiclesCsv, type ImportReport } from "@/lib/services/importService";

export async function importCsvAction(
  _prev: ImportReport | { error: string } | null,
  formData: FormData
): Promise<ImportReport | { error: string }> {
  const user = await requireUser();

  try {
    assertRole(user, "FLEET_MANAGER");
  } catch (err) {
    if (err instanceof RuleViolationError) return { error: err.message };
    throw err;
  }

  const entity = formData.get("entity");
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return { error: "Choose a CSV file first." };
  }
  if (file.size > 1_000_000) {
    return { error: "File too large (max 1 MB)." };
  }

  let report: ImportReport;
  try {
    const text = await file.text();
    report = entity === "drivers" ? await importDriversCsv(text) : await importVehiclesCsv(text);
  } catch {
    return { error: "Could not parse that file as CSV." };
  }

  revalidatePath("/vehicles");
  revalidatePath("/drivers");
  return report;
}
