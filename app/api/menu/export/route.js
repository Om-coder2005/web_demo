import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";
import { resolveOutletForSession } from "../../../../lib/scope.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const session = getSessionFromRequest(request);
  const hotelId = new URL(request.url).searchParams.get("hotelId");
  const outlet = await resolveOutletForSession(session, hotelId);
  if (!outlet) return NextResponse.json({ error: "Hotel access required." }, { status: 403 });

  const items = await prisma.menuItem.findMany({
    where: { outletId: outlet.id },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const rows = items.map((item) => ({
    name: item.name,
    category: item.category,
    price: item.price,
    description: item.description,
    prepTime: item.prepTime,
    available: item.available ? "yes" : "no",
    trackStock: item.trackStock ? "yes" : "no",
    stockQuantity: item.stockQuantity,
    lowStockThreshold: item.lowStockThreshold,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Menu");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const safeHotelId = outlet.hotelId.replace(/[^a-z0-9-]/gi, "-");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeHotelId}-menu.xlsx"`,
    },
  });
}
