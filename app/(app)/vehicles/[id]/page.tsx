import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicle } from "@/lib/services/vehicleService";
import { requireUser } from "@/lib/session";
import { titleCase } from "@/lib/domain";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { ControlPanel, EmptyRow, FormSheet, ListView, SecondaryButton, StatusBadge, Td, Th } from "@/components/ui";
import { VehicleForm } from "@/components/VehicleForm";
import { setVehicleRetiredFormAction, updateVehicleAction } from "../actions";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  const updateWithId = updateVehicleAction.bind(null, vehicle.id);
  const retire = setVehicleRetiredFormAction.bind(null, vehicle.id, true);
  const reactivate = setVehicleRetiredFormAction.bind(null, vehicle.id, false);

  return (
    <>
      <ControlPanel
        title={`${vehicle.name} · ${vehicle.regNumber}`}
        breadcrumb={{ href: "/vehicles", label: "Vehicles" }}
        actions={<StatusBadge status={vehicle.status} />}
        right={
          vehicle.status === "RETIRED" ? (
            <form action={reactivate.bind(null)}>
              <SecondaryButton type="submit">Reactivate</SecondaryButton>
            </form>
          ) : (
            <form action={retire.bind(null)}>
              <SecondaryButton type="submit">Retire Vehicle</SecondaryButton>
            </form>
          )
        }
      />

      <FormSheet>
        <VehicleForm action={updateWithId} defaults={vehicle} submitLabel="Save Changes" />
      </FormSheet>

      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mt-2 px-2 text-sm font-semibold text-gray-600">Trip History</h2>
      </div>
      <div className="mx-auto max-w-4xl">
        <ListView>
          <thead>
            <tr>
              <Th>Route</Th>
              <Th>Driver</Th>
              <Th right>Cargo (kg)</Th>
              <Th right>Revenue</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {vehicle.trips.length === 0 && <EmptyRow colSpan={5} message="No trips yet." />}
            {vehicle.trips.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <Td>
                  <Link href={`/trips/${t.id}`} className="text-odoo-teal hover:underline">
                    {t.source} → {t.destination}
                  </Link>
                </Td>
                <Td>{t.driver.name}</Td>
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

      <div className="mx-auto max-w-4xl px-4">
        <h2 className="px-2 text-sm font-semibold text-gray-600">Maintenance History</h2>
      </div>
      <div className="mx-auto max-w-4xl">
        <ListView>
          <thead>
            <tr>
              <Th>Job</Th>
              <Th right>Cost</Th>
              <Th>Opened</Th>
              <Th>Closed</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {vehicle.maintenance.length === 0 && <EmptyRow colSpan={5} message="No maintenance records." />}
            {vehicle.maintenance.map((m) => (
              <tr key={m.id}>
                <Td>{m.title}</Td>
                <Td right>{formatINR(m.cost)}</Td>
                <Td>{formatDate(m.openedAt)}</Td>
                <Td>{formatDate(m.closedAt)}</Td>
                <Td>
                  <StatusBadge status={m.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </ListView>
      </div>

      <div className="mx-auto max-w-4xl px-4">
        <h2 className="px-2 text-sm font-semibold text-gray-600">Fuel Logs · {titleCase(vehicle.type)}</h2>
      </div>
      <div className="mx-auto max-w-4xl pb-8">
        <ListView>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th right>Liters</Th>
              <Th right>Cost</Th>
              <Th>Note</Th>
            </tr>
          </thead>
          <tbody>
            {vehicle.fuelLogs.length === 0 && <EmptyRow colSpan={4} message="No fuel logs." />}
            {vehicle.fuelLogs.map((f) => (
              <tr key={f.id}>
                <Td>{formatDate(f.date)}</Td>
                <Td right>{formatNumber(f.liters)}</Td>
                <Td right>{formatINR(f.cost)}</Td>
                <Td>{f.note ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </ListView>
      </div>
    </>
  );
}
