import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";
import { sendMachineCredentialsEmail } from "../../../../lib/mailer.js";

/**
 * GET /api/machine/credentials
 * Get non-secret machine status for the current owner's outlet.
 */
export async function GET(request) {
  const session = getSessionFromRequest(request);

  if (!session || !["hotel_owner", "franchise_owner"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }
  if (!session.outletId) {
    return NextResponse.json({ error: "This account is not scoped to an outlet." }, { status: 400 });
  }

  const credential = await prisma.machineCredential.findUnique({
    where: { outletId: session.outletId },
    include: { outlet: true },
  });

  if (!credential) {
    return NextResponse.json({ credential: null });
  }

  return NextResponse.json({
    credential: {
      id: credential.id,
      machineEmail: credential.machineEmail,
      isOnline: credential.isOnline,
      lastHeartbeat: credential.lastHeartbeat,
      passwordLastRotatedAt: credential.passwordLastRotatedAt,
      outletName: credential.outlet.name,
    },
  });
}

/**
 * POST /api/machine/credentials
 * Generate (or rotate) machine credentials for an outlet.
 * Only callable by hotel_owner.
 */
export async function POST(request) {
  const session = getSessionFromRequest(request);

  if (!session || session.role !== "hotel_owner") {
    return NextResponse.json({ error: "Unauthorized. Only Outlet Owners can manage machine credentials." }, { status: 403 });
  }

  const outletId = session.outletId;
  if (!outletId) {
    return NextResponse.json({ error: "This account is not scoped to an outlet." }, { status: 400 });
  }

  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet) {
    return NextResponse.json({ error: "Outlet not found." }, { status: 404 });
  }

  // Generate machine credentials
  const slug = outlet.slug || outlet.name.toLowerCase().replace(/\s+/g, "_");
  const machineEmail = `machine.${slug}@khandoli.pos`;

  // Generate a strong 12-character password: letters + digits
  // Returned only in this response and delivered to the owner by email. Never persist it.
  const plainPassword = crypto.randomBytes(18).toString("base64url");
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const apiToken = crypto.randomBytes(32).toString("hex");

  // Upsert machine credential
  const credential = await prisma.machineCredential.upsert({
    where: { outletId },
    create: {
      outletId,
      machineEmail,
      passwordHash,
      apiToken,
    },
    update: {
      machineEmail,
      passwordHash,
      apiToken,
      isOnline: false,
      lastHeartbeat: null,
      passwordLastRotatedAt: new Date(),
    },
  });

  // Ensure a machine user account exists for this outlet
  const machineUserEmail = `machine_user.${slug}@khandoli.pos`;
  await prisma.user.upsert({
    where: { email: machineUserEmail },
    create: {
      email: machineUserEmail,
      passwordHash: passwordHash,
      name: `${outlet.name} – POS Terminal`,
      role: "machine",
      outletId,
    },
    update: {
      passwordHash,
      isActive: true,
    },
  });

  // Email credentials to the owner
  try {
    await sendMachineCredentialsEmail({
      to: session.email,
      outletName: outlet.name,
      machineEmail,
      machinePassword: plainPassword,
    });
  } catch (emailErr) {
    console.warn("[machine/credentials] Failed to email credentials:", emailErr.message);
  }

  return NextResponse.json({
    success: true,
    message: "Machine credentials rotated. Save the password now; it cannot be displayed again.",
    credential: {
      machineEmail,
      machinePassword: plainPassword,
      isOnline: false,
    },
  });
}
