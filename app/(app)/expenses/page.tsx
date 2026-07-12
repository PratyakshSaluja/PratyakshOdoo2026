import { listVehicles } from "@/lib/services/vehicleService";
import { listExpenses, listFuelLogs, vehicleCostSummaries } from "@/lib/services/expenseService";
import { requireUser } from "@/lib/session";
import { canMutate, titleCase } from "@/lib/domain";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { ControlPanel, EmptyRow, ListView, Td, Th } from "@/components/ui";
import { addExpenseAction, addFuelLogAction } from "./actions";
import { FuelLogForm } from "./FuelLogForm";
import { ExpenseForm } from "./ExpenseForm";

export default async function ExpensesPage() {
  const user = await requireUser();
  const mayMutate = canMutate(user.role, "expenses");
  const [vehicles, summaries, fuelLogs, expenses] = await Promise.all([
    listVehicles(),
    vehicleCostSummaries(),
    listFuelLogs(),
    listExpenses(),
  ]);

  const vehicleOptions = vehicles
    .filter((v) => v.status !== "RETIRED")
    .map((v) => ({ id: v.id, label: `${v.name} (${v.regNumber})` }));

  return (
    <>
      <ControlPanel title="Fuel & Expenses" />

      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mt-2 px-2 text-sm font-semibold text-gray-600">
          Operational Cost per Vehicle (Fuel + Maintenance)
        </h2>
      </div>
      <div className="mx-auto max-w-5xl">
        <ListView>
          <thead>
            <tr>
              <Th>Vehicle</Th>
              <Th right>Fuel Cost</Th>
              <Th right>Maintenance Cost</Th>
              <Th right>Operational Cost</Th>
              <Th right>Other Expenses</Th>
            </tr>
          </thead>
          <tbody>
            {summaries.length === 0 && <EmptyRow colSpan={5} message="No vehicles yet." />}
            {summaries.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <Td>
                  {s.name}
                  <div className="text-xs text-gray-400">{s.regNumber}</div>
                </Td>
                <Td right>{formatINR(s.fuelCost)}</Td>
                <Td right>{formatINR(s.maintenanceCost)}</Td>
                <Td right>
                  <span className="font-semibold">{formatINR(s.operationalCost)}</span>
                </Td>
                <Td right>{formatINR(s.otherExpenses)}</Td>
              </tr>
            ))}
          </tbody>
        </ListView>
      </div>

      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mt-6 px-2 text-sm font-semibold text-gray-600">Fuel Logs</h2>
      </div>
      {mayMutate && (
        <div className="mx-auto max-w-5xl px-4">
          <FuelLogForm action={addFuelLogAction} vehicles={vehicleOptions} />
        </div>
      )}
      <div className="mx-auto max-w-5xl">
        <ListView>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Vehicle</Th>
              <Th right>Liters</Th>
              <Th right>Cost</Th>
              <Th>Note</Th>
            </tr>
          </thead>
          <tbody>
            {fuelLogs.length === 0 && <EmptyRow colSpan={5} message="No fuel logs yet." />}
            {fuelLogs.map((f) => (
              <tr key={f.id}>
                <Td>{formatDate(f.date)}</Td>
                <Td>
                  {f.vehicle.name} <span className="text-xs text-gray-400">({f.vehicle.regNumber})</span>
                </Td>
                <Td right>{formatNumber(f.liters)}</Td>
                <Td right>{formatINR(f.cost)}</Td>
                <Td>{f.note ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </ListView>
      </div>

      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mt-6 px-2 text-sm font-semibold text-gray-600">Other Expenses</h2>
      </div>
      {mayMutate && (
        <div className="mx-auto max-w-5xl px-4">
          <ExpenseForm action={addExpenseAction} vehicles={vehicleOptions} />
        </div>
      )}
      <div className="mx-auto max-w-5xl pb-8">
        <ListView>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Vehicle</Th>
              <Th>Category</Th>
              <Th right>Amount</Th>
              <Th>Note</Th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && <EmptyRow colSpan={5} message="No expenses yet." />}
            {expenses.map((e) => (
              <tr key={e.id}>
                <Td>{formatDate(e.date)}</Td>
                <Td>
                  {e.vehicle.name} <span className="text-xs text-gray-400">({e.vehicle.regNumber})</span>
                </Td>
                <Td>{titleCase(e.category)}</Td>
                <Td right>{formatINR(e.amount)}</Td>
                <Td>{e.note ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </ListView>
      </div>
    </>
  );
}
