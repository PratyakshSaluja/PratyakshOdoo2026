import { requireUser } from "@/lib/session";
import { ControlPanel, FormSheet } from "@/components/ui";
import { VehicleForm } from "@/components/VehicleForm";
import { createVehicleAction } from "../actions";

export default async function NewVehiclePage() {
  await requireUser();
  return (
    <>
      <ControlPanel title="New Vehicle" breadcrumb={{ href: "/vehicles", label: "Vehicles" }} />
      <FormSheet>
        <VehicleForm action={createVehicleAction} submitLabel="Register Vehicle" />
      </FormSheet>
    </>
  );
}
