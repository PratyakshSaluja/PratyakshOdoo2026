import { assignableDrivers, dispatchableVehicles } from "@/lib/services/tripService";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { ControlPanel, FormSheet } from "@/components/ui";
import { TripForm } from "@/components/TripForm";
import { createTripAction } from "../actions";

export default async function NewTripPage() {
  await requireUser();
  const [vehicles, drivers] = await Promise.all([dispatchableVehicles(), assignableDrivers()]);

  const vehicleOptions = vehicles.map((v) => ({
    id: v.id,
    label: `${v.name} (${v.regNumber}) — max ${v.maxLoadKg} kg`,
  }));
  const driverOptions = drivers.map((d) => ({
    id: d.id,
    label: `${d.name} — ${d.licenseCategory}, license valid till ${formatDate(d.licenseExpiry)}`,
  }));

  return (
    <>
      <ControlPanel title="New Trip" breadcrumb={{ href: "/trips", label: "Trips" }} />
      <FormSheet>
        <TripForm
          action={createTripAction}
          vehicles={vehicleOptions}
          drivers={driverOptions}
          submitLabel="Create Trip"
        />
      </FormSheet>
    </>
  );
}
