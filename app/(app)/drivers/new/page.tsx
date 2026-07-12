import { requireUser } from "@/lib/session";
import { ControlPanel, FormSheet } from "@/components/ui";
import { DriverForm } from "@/components/DriverForm";
import { createDriverAction } from "../actions";

export default async function NewDriverPage() {
  await requireUser();
  return (
    <>
      <ControlPanel title="New Driver" breadcrumb={{ href: "/drivers", label: "Drivers" }} />
      <FormSheet>
        <DriverForm action={createDriverAction} submitLabel="Register Driver" />
      </FormSheet>
    </>
  );
}
