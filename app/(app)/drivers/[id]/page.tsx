import Link from "next/link";
import { notFound } from "next/navigation";
import { getDriver } from "@/lib/services/driverService";
import { requireUser } from "@/lib/session";
import { formatINR, formatNumber } from "@/lib/format";
import { ControlPanel, EmptyRow, FormSheet, ListView, SecondaryButton, StatusBadge, Td, Th } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { DriverForm } from "@/components/DriverForm";
import { setDriverStatusAction, updateDriverAction } from "../actions";

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const driver = await getDriver(id);
  if (!driver) notFound();

  const updateWithId = updateDriverAction.bind(null, driver.id);
  const setAvailable = setDriverStatusAction.bind(null, driver.id, "AVAILABLE");
  const setOffDuty = setDriverStatusAction.bind(null, driver.id, "OFF_DUTY");
  const setSuspended = setDriverStatusAction.bind(null, driver.id, "SUSPENDED");

  return (
    <>
      <ControlPanel
        title={driver.name}
        breadcrumb={{ href: "/drivers", label: "Drivers" }}
        actions={<StatusBadge status={driver.status} />}
        right={
          driver.status === "AVAILABLE" ? (
            <>
              <form action={setOffDuty}>
                <SecondaryButton type="submit">Set Off Duty</SecondaryButton>
              </form>
              <form action={setSuspended}>
                <SubmitButton variant="danger">Suspend</SubmitButton>
              </form>
            </>
          ) : driver.status === "OFF_DUTY" ? (
            <>
              <form action={setAvailable}>
                <SecondaryButton type="submit">Set Available</SecondaryButton>
              </form>
              <form action={setSuspended}>
                <SubmitButton variant="danger">Suspend</SubmitButton>
              </form>
            </>
          ) : driver.status === "SUSPENDED" ? (
            <form action={setAvailable}>
              <SecondaryButton type="submit">Reinstate</SecondaryButton>
            </form>
          ) : (
            <span className="text-sm text-gray-500">On active trip</span>
          )
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
