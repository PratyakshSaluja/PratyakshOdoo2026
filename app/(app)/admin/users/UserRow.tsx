"use client";

import { useActionState } from "react";
import { ROLE_LABELS, ROLES } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { StatusBadge, Td } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { setUserStatusAction, updateUserRoleAction } from "./actions";

type UserRowData = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
};

export function UserRow({ user, isSelf }: { user: UserRowData; isSelf: boolean }) {
  const roleAction = updateUserRoleAction.bind(null, user.id);
  const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  const statusAction = setUserStatusAction.bind(null, user.id, nextStatus);

  const [roleState, roleFormAction] = useActionState(roleAction, null);
  const [statusState, statusFormAction] = useActionState(statusAction, null);
  const error = (!roleState?.ok && roleState?.error) || (!statusState?.ok && statusState?.error) || null;

  return (
    <>
      <tr className="hover:bg-gray-50">
        <Td>
          {user.name}
          {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
        </Td>
        <Td>{user.email}</Td>
        <Td>
          <form action={roleFormAction} className="flex items-center gap-2">
            <select
              name="role"
              defaultValue={user.role}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <SubmitButton variant="secondary">Save</SubmitButton>
          </form>
        </Td>
        <Td>
          <StatusBadge status={user.status} />
        </Td>
        <Td>{formatDate(user.createdAt)}</Td>
        <Td>
          {isSelf ? (
            <span className="text-xs text-gray-400">—</span>
          ) : (
            <form action={statusFormAction}>
              <SubmitButton variant={user.status === "ACTIVE" ? "danger" : "secondary"}>
                {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </SubmitButton>
            </form>
          )}
        </Td>
      </tr>
      {error && (
        <tr>
          <td colSpan={6} className="border-b border-gray-100 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </td>
        </tr>
      )}
    </>
  );
}
