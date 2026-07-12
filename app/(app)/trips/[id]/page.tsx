import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrip } from "@/lib/services/tripService";
import { requireUser } from "@/lib/session";
import { canMutate } from "@/lib/domain";
import { formatDateTime, formatINR, formatNumber } from "@/lib/format";
import { ControlPanel, FieldGrid, FormSheet } from "@/components/ui";
import { StatusBar } from "@/components/StatusBar";
import { TripActions } from "@/components/TripActions";
import { cancelTripAction, completeTripAction, dispatchTripAction } from "../actions";

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[13px] font-medium text-gray-600">{label}</div>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) notFound();

  const dispatchAction = dispatchTripAction.bind(null, trip.id);
  const completeAction = completeTripAction.bind(null, trip.id);
  const cancelAction = cancelTripAction.bind(null, trip.id);

  return (
    <>
      <ControlPanel
        title={`${trip.source} → ${trip.destination}`}
        breadcrumb={{ href: "/trips", label: "Trips" }}
        right={<StatusBar stages={["DRAFT", "DISPATCHED", "COMPLETED"]} current={trip.status} />}
      />

      <FormSheet>
        <FieldGrid>
          <DetailField label="Vehicle">
            <Link href={`/vehicles/${trip.vehicle.id}`} className="text-odoo-teal hover:underline">
              {trip.vehicle.name} ({trip.vehicle.regNumber})
            </Link>
          </DetailField>
          <DetailField label="Driver">
            <Link href={`/drivers/${trip.driver.id}`} className="text-odoo-teal hover:underline">
              {trip.driver.name}
            </Link>
          </DetailField>
          <DetailField label="Cargo Weight (kg)">{formatNumber(trip.cargoWeightKg)}</DetailField>
          <DetailField label="Planned Distance (km)">{formatNumber(trip.plannedDistanceKm)}</DetailField>
          <DetailField label="Revenue">{formatINR(trip.revenue)}</DetailField>
          <DetailField label="Start Odometer">
            {trip.startOdometerKm != null ? formatNumber(trip.startOdometerKm) : "—"}
          </DetailField>
          <DetailField label="End Odometer">
            {trip.endOdometerKm != null ? formatNumber(trip.endOdometerKm) : "—"}
          </DetailField>
          <DetailField label="Fuel Consumed (L)">
            {trip.fuelConsumedL != null ? formatNumber(trip.fuelConsumedL) : "—"}
          </DetailField>
          <DetailField label="Dispatched At">{formatDateTime(trip.dispatchedAt)}</DetailField>
          <DetailField label="Completed At">{formatDateTime(trip.completedAt)}</DetailField>
        </FieldGrid>
      </FormSheet>

      {canMutate(user.role, "trips") && (
        <TripActions
          status={trip.status}
          dispatchAction={dispatchAction}
          completeAction={completeAction}
          cancelAction={cancelAction}
        />
      )}
    </>
  );
}
