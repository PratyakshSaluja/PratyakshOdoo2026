"use server";

import { RuleViolationError } from "@/lib/errors";
import { assertRole, requireUser } from "@/lib/session";
import { syncNow, type SyncReport } from "@/lib/services/sheetSyncService";

export type SyncActionState = SyncReport | { error: string } | null;

export async function syncNowAction(_prev: SyncActionState, _formData: FormData): Promise<SyncActionState> {
  const user = await requireUser();
  try {
    assertRole(user); // Fleet Manager only
    return await syncNow();
  } catch (e) {
    if (e instanceof RuleViolationError) return { error: e.message };
    console.error(e);
    return { error: "Sync failed — check the server logs." };
  }
}
