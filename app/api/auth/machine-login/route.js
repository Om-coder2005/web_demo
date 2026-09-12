import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/db.js";
import { createToken, setSessionCookie } from "../../../../lib/auth.js";

/**
 * POST /api/auth/machine-login
 * Authenticates a POS Machine terminal using email + password.
 * Machine credentials are auto-generated and stored per outlet.
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Machine email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find the machine credential record
    const machineCredential = await prisma.machineCredential.findUnique({
      where: { machineEmail: normalizedEmail },
      include: { outlet: true },
    });

    if (!machineCredential) {
      return NextResponse.json(
        { error: "Invalid machine credentials. Contact your outlet owner." },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, machineCredential.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid machine credentials." }, { status: 401 });
    }

    // Find the machine user account for this outlet
    const machineUser = await prisma.user.findFirst({
      where: {
        outletId: machineCredential.outletId,
        role: "machine",
        isActive: true,
      },
      include: { outlet: true },
    });

    if (!machineUser) {
      return NextResponse.json(
        { error: "Machine user account not found. Contact franchise support." },
        { status: 404 }
      );
    }

    // Update machine online status and heartbeat
    await prisma.machineCredential.update({
      where: { id: machineCredential.id },
      data: {
        isOnline: true,
        lastHeartbeat: new Date(),
      },
    });

    // Create JWT session token
    const tokenPayload = {
      userId: machineUser.id,
      email: machineUser.email,
      name: machineUser.name,
      role: "machine",
      outletId: machineUser.outletId,
      hotelId: machineUser.outlet?.hotelId || null,
      outletName: machineUser.outlet?.name || null,
      isMachine: true,
    };

    const token = createToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      user: tokenPayload,
      redirect: "/tables",
    });

    return setSessionCookie(response, token);
  } catch (error) {
    console.error("[machine-login] Error:", error);
    return NextResponse.json({ error: "Machine login failed. Please try again." }, { status: 500 });
  }
}
