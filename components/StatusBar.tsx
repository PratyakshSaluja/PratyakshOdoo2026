import { titleCase } from "@/lib/domain";

/**
 * Odoo-style chevron pipeline (e.g. Draft ▸ Dispatched ▸ Completed).
 * Terminal side-states (Cancelled) render as a single red stage.
 */
export function StatusBar({ stages, current }: { stages: string[]; current: string }) {
  if (!stages.includes(current)) {
    return (
      <div className="flex">
        <span className="stage bg-red-100 px-5 py-1.5 text-xs font-semibold text-red-700">
          {titleCase(current)}
        </span>
      </div>
    );
  }

  const currentIdx = stages.indexOf(current);
  return (
    <div className="flex">
      {stages.map((stage, i) => {
        const state = i < currentIdx ? "past" : i === currentIdx ? "current" : "future";
        const cls =
          state === "current"
            ? "bg-odoo text-white"
            : state === "past"
              ? "bg-odoo/15 text-odoo"
              : "bg-gray-100 text-gray-400";
        return (
          <span key={stage} className={`stage -ml-1.5 px-5 py-1.5 text-xs font-semibold first:ml-0 ${cls}`}>
            {titleCase(stage)}
          </span>
        );
      })}
    </div>
  );
}
