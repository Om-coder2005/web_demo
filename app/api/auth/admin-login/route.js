import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/db.js";
import { createToken, setSessionCookie } from "../../../../lib/auth.js";

export async function POST(request) {
  const { username, password } = await request.json();
  if (username !== "admin" || !password) return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { email: "admin@khandoli.local" } });
  if (!admin || admin.role !== "admin" || !admin.isActive || !(await bcrypt.compare(password, admin.passwordHash))) {
    return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
  }
  const user = { userId: admin.id, email: admin.email, name: admin.name, role: admin.role, outletId: null, outletName: null };
  return setSessionCookie(NextResponse.json({ success: true, user, redirect: "/admin" }), createToken(user, "8h"));
}
