import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";
import { canEditOutletMenu, resolveOutletForSession } from "../../../../lib/scope.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function truthy(value) {
  return ["yes", "true", "1", "available"].includes(String(value || "").trim().toLowerCase());
}

function rowToMenuItem(row) {
  const price = Number(row.price);
  return {
    name: String(row.name || row.Name || "").trim(),
    category: String(row.category || row.Category || "General").trim(),
    price,
    description: String(row.description || row.Description || "").trim(),
    prepTime: String(row.prepTime || row["prep time"] || row.PrepTime || "10 mins").trim(),
    available: row.available === undefined ? true : truthy(row.available),
    trackStock: truthy(row.trackStock || row["track stock"]),
    stockQuantity: Number.isFinite(Number(row.stockQuantity)) ? Number(row.stockQuantity) : 0,
    lowStockThreshold: Number.isFinite(Number(row.lowStockThreshold)) ? Number(row.lowStockThreshold) : 10,
  };
}

export async function POST(request) {
  const session = getSessionFromRequest(request);
  if (!canEditOutletMenu(session?.role)) return NextResponse.json({ error: "Only hotel owners can import menu." }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  const hotelId = formData.get("hotelId");
  const outlet = await resolveOutletForSession(session, hotelId ? String(hotelId) : undefined);
  if (!outlet) return NextResponse.json({ error: "Hotel access required." }, { status: 403 });
  if (!file || typeof file.arrayBuffer !== "function") return NextResponse.json({ error: "XLSX file is required." }, { status: 400 });

  const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName] || {});
  const items = rows.map(rowToMenuItem).filter((item) => item.name && Number.isFinite(item.price) && item.price >= 0);

  if (!items.length) {
    return NextResponse.json({ error: "No valid menu rows found. Use columns: name, category, price." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.menuItem.deleteMany({ where: { outletId: outlet.id } }),
    prisma.menuItem.createMany({ data: items.map((item) => ({ ...item, outletId: outlet.id })) }),
  ]);

  return NextResponse.json({ success: true, imported: items.length, outlet });
}
