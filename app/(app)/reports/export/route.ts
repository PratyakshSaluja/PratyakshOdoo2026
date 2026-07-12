import { getSession } from "@/lib/session";
import { reportToCsv, vehicleReport } from "@/lib/services/reportService";

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const csv = reportToCsv(await vehicleReport());
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transitops-vehicle-report.csv"`,
    },
  });
}
