import { requireUser } from "@/lib/session";
import { maintainableVehicles } from "@/lib/services/maintenanceService";
import { ControlPanel, FormSheet } from "@/components/ui";
import { MaintenanceForm } from "@/components/MaintenanceForm";
import { openMaintenanceAction } from "../actions";

export default async function NewMaintenancePage() {
  await requireUser();
  const vehicles = await maintainableVehicles();
  const options = vehicles.map((v) => ({
    id: v.id,
    label: `${v.name} (${v.regNumber}) — ${v.status}`,
  }));

  return (
    <>
      <ControlPanel title="New Maintenance Log" breadcrumb={{ href: "/maintenance", label: "Maintenance" }} />
      <FormSheet>
        <MaintenanceForm action={openMaintenanceAction} vehicles={options} submitLabel="Open Maintenance Log" />
      </FormSheet>
    </>
  );
}
