import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../../../lib/db.js";

export async function POST(request) {
  const { name, email } = await request.json();
  const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
  const normalizedName = typeof name === "string" ? name.trim() : "";
  if (normalizedName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return NextResponse.json({ error: "Enter your name and a valid email address." }, { status: 400 });
  try {
    await prisma.user.create({ data: { name: normalizedName, email: normalizedEmail, role: "waiter", isActive: false, passwordHash: await bcrypt.hash(crypto.randomUUID(), 12) } });
    return NextResponse.json({ success: true, message: "Request received. An administrator must approve your account before you can sign in." }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
    console.error("[signup] Error:", error);
    return NextResponse.json({ error: "Could not create the account request." }, { status: 500 });
  }
}
