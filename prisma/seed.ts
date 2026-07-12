import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const daysAhead = (n: number) => new Date(Date.now() + n * DAY);

async function main() {
  // Wipe in FK-safe order so the seed is re-runnable.
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = bcrypt.hashSync("demo1234", 10);
  await prisma.user.createMany({
    data: [
      { email: "fleet@transitops.in", name: "Pratyaksh Saluja", role: "FLEET_MANAGER", passwordHash },
      { email: "dispatch@transitops.in", name: "Rohit Menon", role: "DRIVER", passwordHash },
      { email: "safety@transitops.in", name: "Kavita Iyer", role: "SAFETY_OFFICER", passwordHash },
      { email: "finance@transitops.in", name: "Ankit Bansal", role: "FINANCIAL_ANALYST", passwordHash },
    ],
  });

  const [ace, dost, eicher, bolero, tata407, eeco, splendor, lpt] = await Promise.all(
    [
      { regNumber: "MH12AB3344", name: "Tata Ace Gold", type: "VAN", maxLoadKg: 750, odometerKm: 42350, acquisitionCost: 650000, region: "West", status: "AVAILABLE" },
      { regNumber: "DL01CD5566", name: "Ashok Leyland Dost+", type: "TRUCK", maxLoadKg: 1250, odometerKm: 78200, acquisitionCost: 890000, region: "North", status: "AVAILABLE" },
      { regNumber: "HR38EF7788", name: "Eicher Pro 2049", type: "TRUCK", maxLoadKg: 5000, odometerKm: 112400, acquisitionCost: 1850000, region: "North", status: "ON_TRIP" },
      { regNumber: "KA05GH2211", name: "Mahindra Bolero Pickup", type: "TRUCK", maxLoadKg: 1500, odometerKm: 65100, acquisitionCost: 950000, region: "South", status: "AVAILABLE" },
      { regNumber: "TN09IJ4455", name: "Tata 407", type: "TRUCK", maxLoadKg: 2500, odometerKm: 145800, acquisitionCost: 1200000, region: "South", status: "IN_SHOP" },
      { regNumber: "GJ01KL8899", name: "Maruti Eeco Cargo", type: "VAN", maxLoadKg: 600, odometerKm: 38900, acquisitionCost: 550000, region: "West", status: "AVAILABLE" },
      { regNumber: "UP16OP3300", name: "Hero Splendor+ (Courier)", type: "BIKE", maxLoadKg: 25, odometerKm: 21000, acquisitionCost: 85000, region: "North", status: "AVAILABLE" },
      { regNumber: "RJ14QR6677", name: "Tata LPT 709", type: "TRUCK", maxLoadKg: 4500, odometerKm: 289000, acquisitionCost: 1400000, region: "West", status: "RETIRED" },
    ].map((data) => prisma.vehicle.create({ data }))
  );

  const [ramesh, suresh, amit, vikram, manoj, deepak, arjun] = await Promise.all(
    [
      { name: "Ramesh Yadav", licenseNumber: "DL-0420190001234", licenseCategory: "HMV", licenseExpiry: daysAhead(600), phone: "9811001234", safetyScore: 92, status: "AVAILABLE" },
      { name: "Suresh Kumar", licenseNumber: "HR-0520180005678", licenseCategory: "HMV", licenseExpiry: daysAhead(480), phone: "9899005678", safetyScore: 88, status: "ON_TRIP" },
      { name: "Amit Sharma", licenseNumber: "DL-0420200009012", licenseCategory: "LMV", licenseExpiry: daysAhead(60), phone: "9810009012", safetyScore: 95, status: "AVAILABLE" },
      // Expired license — demonstrates mandatory rule: cannot be assigned to trips.
      { name: "Vikram Singh", licenseNumber: "RJ-1420150003456", licenseCategory: "HMV", licenseExpiry: daysAgo(43), phone: "9829003456", safetyScore: 79, status: "AVAILABLE" },
      // Suspended — demonstrates mandatory rule: cannot be assigned to trips.
      { name: "Manoj Patel", licenseNumber: "GJ-0120170007890", licenseCategory: "LMV", licenseExpiry: daysAhead(400), phone: "9825007890", safetyScore: 55, status: "SUSPENDED" },
      { name: "Deepak Verma", licenseNumber: "MH-1220210002468", licenseCategory: "LMV", licenseExpiry: daysAhead(320), phone: "9820102468", safetyScore: 90, status: "OFF_DUTY" },
      { name: "Arjun Nair", licenseNumber: "KA-0520190001357", licenseCategory: "MCWG", licenseExpiry: daysAhead(760), phone: "9845001357", safetyScore: 97, status: "AVAILABLE" },
    ].map((data) => prisma.driver.create({ data }))
  );

  // ---- Completed trips (history feeding reports) -------------------------
  const completedTrips = [
    { vehicle: dost, driver: ramesh, source: "Delhi", destination: "Jaipur", cargoWeightKg: 1100, plannedDistanceKm: 280, revenue: 18500, start: 77620, end: 77910, fuel: 24, fuelCost: 2246, endDaysAgo: 12 },
    { vehicle: dost, driver: ramesh, source: "Jaipur", destination: "Delhi", cargoWeightKg: 950, plannedDistanceKm: 280, revenue: 16200, start: 77910, end: 78200, fuel: 25, fuelCost: 2340, endDaysAgo: 9 },
    { vehicle: ace, driver: amit, source: "Pune", destination: "Mumbai", cargoWeightKg: 600, plannedDistanceKm: 150, revenue: 8200, start: 42195, end: 42350, fuel: 11, fuelCost: 1030, endDaysAgo: 6 },
    { vehicle: bolero, driver: arjun, source: "Bengaluru", destination: "Chennai", cargoWeightKg: 1200, plannedDistanceKm: 350, revenue: 21000, start: 64745, end: 65100, fuel: 30, fuelCost: 2810, endDaysAgo: 4 },
    { vehicle: eeco, driver: amit, source: "Ahmedabad", destination: "Vadodara", cargoWeightKg: 450, plannedDistanceKm: 110, revenue: 5600, start: 38788, end: 38900, fuel: 8, fuelCost: 750, endDaysAgo: 2 },
  ];

  for (const t of completedTrips) {
    const trip = await prisma.trip.create({
      data: {
        source: t.source,
        destination: t.destination,
        vehicleId: t.vehicle.id,
        driverId: t.driver.id,
        cargoWeightKg: t.cargoWeightKg,
        plannedDistanceKm: t.plannedDistanceKm,
        revenue: t.revenue,
        startOdometerKm: t.start,
        endOdometerKm: t.end,
        fuelConsumedL: t.fuel,
        status: "COMPLETED",
        dispatchedAt: daysAgo(t.endDaysAgo + 1),
        completedAt: daysAgo(t.endDaysAgo),
        createdAt: daysAgo(t.endDaysAgo + 1),
      },
    });
    await prisma.fuelLog.create({
      data: {
        vehicleId: t.vehicle.id,
        tripId: trip.id,
        liters: t.fuel,
        cost: t.fuelCost,
        note: `Trip ${t.source} → ${t.destination}`,
        date: daysAgo(t.endDaysAgo),
      },
    });
  }

  // ---- Active dispatched trip (Eicher + Suresh are ON_TRIP) --------------
  await prisma.trip.create({
    data: {
      source: "Gurugram",
      destination: "Lucknow",
      vehicleId: eicher.id,
      driverId: suresh.id,
      cargoWeightKg: 4200,
      plannedDistanceKm: 510,
      revenue: 34500,
      startOdometerKm: 112400,
      status: "DISPATCHED",
      dispatchedAt: new Date(Date.now() - 5 * 3600_000),
    },
  });

  // ---- Draft trips (pending dispatch) ------------------------------------
  await prisma.trip.createMany({
    data: [
      { source: "Mumbai", destination: "Nashik", vehicleId: ace.id, driverId: amit.id, cargoWeightKg: 500, plannedDistanceKm: 170, revenue: 9000, status: "DRAFT" },
      { source: "Chennai", destination: "Coimbatore", vehicleId: bolero.id, driverId: arjun.id, cargoWeightKg: 1300, plannedDistanceKm: 500, revenue: 26000, status: "DRAFT" },
    ],
  });

  // ---- Cancelled trip (history) ------------------------------------------
  await prisma.trip.create({
    data: {
      source: "Delhi",
      destination: "Chandigarh",
      vehicleId: dost.id,
      driverId: ramesh.id,
      cargoWeightKg: 800,
      plannedDistanceKm: 250,
      revenue: 0,
      status: "CANCELLED",
      createdAt: daysAgo(15),
    },
  });

  // ---- Maintenance -------------------------------------------------------
  await prisma.maintenanceLog.create({
    data: { vehicleId: tata407.id, title: "Clutch overhaul", notes: "Slipping under load; parts ordered.", cost: 18500, status: "OPEN", openedAt: daysAgo(1) },
  });
  await prisma.maintenanceLog.createMany({
    data: [
      { vehicleId: dost.id, title: "Oil change + filters", cost: 4200, status: "CLOSED", openedAt: daysAgo(20), closedAt: daysAgo(19) },
      { vehicleId: ace.id, title: "Brake pad replacement", cost: 3600, status: "CLOSED", openedAt: daysAgo(30), closedAt: daysAgo(29) },
    ],
  });

  // ---- Standalone fuel logs + expenses ------------------------------------
  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: eicher.id, liters: 60, cost: 5590, note: "Full tank before Lucknow run", date: daysAgo(1) },
      { vehicleId: splendor.id, liters: 6, cost: 630, note: "Weekly courier rounds", date: daysAgo(3) },
    ],
  });
  await prisma.expense.createMany({
    data: [
      { vehicleId: dost.id, category: "TOLL", amount: 850, note: "NH48 tolls, Jaipur run", date: daysAgo(9) },
      { vehicleId: bolero.id, category: "TOLL", amount: 1240, note: "Chennai highway tolls", date: daysAgo(4) },
      { vehicleId: ace.id, category: "PARKING", amount: 300, note: "Mumbai overnight parking", date: daysAgo(6) },
      { vehicleId: eicher.id, category: "OTHER", amount: 500, note: "Loading labour", date: daysAgo(1) },
    ],
  });

  console.log("Seed complete:");
  console.log("  8 vehicles, 7 drivers, 9 trips, 3 maintenance logs, fuel + expenses");
  console.log("  Logins (password: demo1234):");
  console.log("    fleet@transitops.in    — Fleet Manager");
  console.log("    dispatch@transitops.in — Driver (Dispatcher)");
  console.log("    safety@transitops.in   — Safety Officer");
  console.log("    finance@transitops.in  — Financial Analyst");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
