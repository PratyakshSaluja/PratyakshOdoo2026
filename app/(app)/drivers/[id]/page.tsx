import Link from "next/link";
import { notFound } from "next/navigation";
import { getDriver } from "@/lib/services/driverService";
import { requireUser } from "@/lib/session";
import { canMutate } from "@/lib/domain";
import { formatINR, formatNumber } from "@/lib/format";
import { ControlPanel, EmptyRow, FormSheet, ListView, StatusBadge, Td, Th } from "@/components/ui";
import { DriverForm } from "@/components/DriverForm";
import { StatusActionButtons, type StatusAction } from "@/components/StatusActionButtons";
import { deleteDriverAction, setDriverStatusAction, updateDriverAction } from "../actions";

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const driver = await getDriver(id);
  if (!driver) notFound();

  const updateWithId = updateDriverAction.bind(null, driver.id);
  const deleteAction: StatusAction = {
    label: "Delete",
    variant: "danger",
    action: deleteDriverAction.bind(null, driver.id),
  };

  let statusActions: StatusAction[] | null = null;
  if (canMutate(user.role, "drivers")) {
    if (driver.status === "AVAILABLE") {
      statusActions = [
        { label: "Set Off Duty", variant: "secondary", action: setDriverStatusAction.bind(null, driver.id, "OFF_DUTY") },
        { label: "Suspend", variant: "danger", action: setDriverStatusAction.bind(null, driver.id, "SUSPENDED") },
        deleteAction,
      ];
    } else if (driver.status === "OFF_DUTY") {
      statusActions = [
        { label: "Set Available", variant: "secondary", action: setDriverStatusAction.bind(null, driver.id, "AVAILABLE") },
        { label: "Suspend", variant: "danger", action: setDriverStatusAction.bind(null, driver.id, "SUSPENDED") },
        deleteAction,
      ];
    } else if (driver.status === "SUSPENDED") {
      statusActions = [
        { label: "Reinstate", variant: "secondary", action: setDriverStatusAction.bind(null, driver.id, "AVAILABLE") },
        deleteAction,
      ];
    }
    // ON_TRIP: no status actions — driver must complete/cancel the trip first.
  }

  return (
    <>
      <ControlPanel
        title={driver.name}
        breadcrumb={{ href: "/drivers", label: "Drivers" }}
        actions={<StatusBadge status={driver.status} />}
        right={
          statusActions ? (
            <StatusActionButtons actions={statusActions} />
          ) : driver.status === "ON_TRIP" ? (
            <span className="text-sm text-gray-500">On active trip</span>
          ) : undefined
        }
      />

      <FormSheet>
        <DriverForm action={updateWithId} defaults={driver} submitLabel="Save Changes" />
      </FormSheet>

      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mt-2 px-2 text-sm font-semibold text-gray-600">Trip History</h2>
      </div>
      <div className="mx-auto max-w-4xl pb-8">
        <ListView>
          <thead>
            <tr>
              <Th>Route</Th>
              <Th>Vehicle</Th>
              <Th right>Cargo (kg)</Th>
              <Th right>Revenue</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {driver.trips.length === 0 && <EmptyRow colSpan={5} message="No trips yet." />}
            {driver.trips.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <Td>
                  <Link href={`/trips/${t.id}`} className="text-odoo-teal hover:underline">
                    {t.source} → {t.destination}
                  </Link>
                </Td>
                <Td>{t.vehicle.name}</Td>
                <Td right>{formatNumber(t.cargoWeightKg)}</Td>
                <Td right>{formatINR(t.revenue)}</Td>
                <Td>
                  <StatusBadge status={t.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </ListView>
      </div>
    </>
  );
}
