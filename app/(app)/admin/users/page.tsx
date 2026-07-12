import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { canMutate } from "@/lib/domain";
import { listUsers } from "@/lib/services/userService";
import { ControlPanel, EmptyRow, FormSheet, ListView, Td, Th } from "@/components/ui";
import { CreateUserForm } from "./CreateUserForm";
import { UserRow } from "./UserRow";

export default async function AdminUsersPage() {
  const user = await requireUser();
  // Server-side guard: only the Fleet Manager administers accounts.
  if (!canMutate(user.role, "users")) redirect("/dashboard");

  const users = await listUsers();

  return (
    <>
      <ControlPanel title="User Administration" />

      <div className="mx-auto max-w-4xl px-4 pt-2">
        <h2 className="px-2 text-sm font-semibold text-gray-600">Create Account</h2>
      </div>
      <FormSheet>
        <p className="mb-4 text-sm text-gray-600">
          Only the Fleet Manager can provision accounts — roles are assigned here, never self-selected
          at signup. Share the temporary password with the new user out of band.
        </p>
        <CreateUserForm />
      </FormSheet>

      <div className="mx-auto max-w-5xl px-4">
        <h2 className="px-2 text-sm font-semibold text-gray-600">All Users</h2>
      </div>
      <div className="mx-auto max-w-5xl">
        <ListView>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && <EmptyRow colSpan={6} message="No users yet." />}
            {users.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === user.id} />
            ))}
          </tbody>
        </ListView>
      </div>
    </>
  );
}
