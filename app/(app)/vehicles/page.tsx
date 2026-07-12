import Link from "next/link";
import { listVehicles } from "@/lib/services/vehicleService";
import { requireUser } from "@/lib/session";
import { REGIONS, VEHICLE_STATUSES, VEHICLE_TYPES, titleCase } from "@/lib/domain";
import { formatINR, formatNumber } from "@/lib/format";
import { ControlPanel, EmptyRow, ListView, PrimaryLink, StatusBadge, Td, Th, inputClass } from "@/components/ui";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; region?: string; q?: string }>;
}) {
  await requireUser();
  const filters = await searchParams;
  const vehicles = await listVehicles(filters);

  return (
    <>
      <ControlPanel
        title="Vehicles"
        actions={<PrimaryLink href="/vehicles/new">New</PrimaryLink>}
        right={
          <form className="flex flex-wrap items-center gap-2" method="get">
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Search reg no. / name"
              className={`${inputClass} w-44`}
            />
            <select name="type" defaultValue={filters.type ?? ""} className={`${inputClass} w-28`}>
              <option value="">All types</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={filters.status ?? ""} className={`${inputClass} w-32`}>
              <option value="">All statuses</option>
              {VEHICLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
            <select name="region" defaultValue={filters.region ?? ""} className={`${inputClass} w-28`}>
              <option value="">All regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
              Filter
            </button>
          </form>
        }
      />
      <ListView>
        <thead>
          <tr>
            <Th>Reg Number</Th>
            <Th>Vehicle</Th>
            <Th>Type</Th>
            <Th>Region</Th>
            <Th right>Max Load (kg)</Th>
            <Th right>Odometer (km)</Th>
            <Th right>Acquisition Cost</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length === 0 && <EmptyRow colSpan={8} message="No vehicles match these filters." />}
          {vehicles.map((v) => (
            <tr key={v.id} className="hover:bg-gray-50">
              <Td>
                <Link href={`/vehicles/${v.id}`} className="font-medium text-odoo-teal hover:underline">
                  {v.regNumber}
                </Link>
              </Td>
              <Td>{v.name}</Td>
              <Td>{titleCase(v.type)}</Td>
              <Td>{v.region}</Td>
              <Td right>{formatNumber(v.maxLoadKg)}</Td>
              <Td right>{formatNumber(v.odometerKm)}</Td>
              <Td right>{formatINR(v.acquisitionCost)}</Td>
              <Td>
                <StatusBadge status={v.status} />
              </Td>
            </tr>
          ))}
        </tbody>
      </ListView>
    </>
  );
}
