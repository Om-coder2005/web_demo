import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSessionFromRequest } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const sampleRows = [
  {
    name: "Paneer Khandoli Roll",
    category: "Khandoli",
    price: 120,
    description: "Freshly prepared",
    prepTime: "10 mins",
    available: "yes",
    trackStock: "no",
    stockQuantity: 0,
    lowStockThreshold: 10,
  },
];

export async function GET(request) {
  const session = getSessionFromRequest(request);
  if (!session || !["hotel_owner", "franchise_owner", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Login required." }, { status: 403 });
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Menu");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="khandoli-menu-template.xlsx"',
    },
  });
}
