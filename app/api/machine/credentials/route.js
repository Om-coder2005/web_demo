import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../../../lib/db.js";
import { getSessionFromRequest } from "../../../../lib/auth.js";
import { sendMachineCredentialsEmail } from "../../../../lib/mailer.js";

/**
 * GET /api/machine/credentials
 * Get the machine credential for the current owner's outlet.
 */
export async function GET(request) {
  const session = getSessionFromRequest(request);

  if (!session || !["hotel_owner", "franchise_owner"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
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
      // Never send hash — send the stored plain password for display
      machinePassword: credential.plainPassword,
      isOnline: credential.isOnline,
      lastHeartbeat: credential.lastHeartbeat,
      outletName: credential.outlet.name,
    },
  });
}

/**
 * POST /api/machine/credentials
 * Generate (or regenerate) machine credentials for an outlet.
 * Only callable by hotel_owner.
 */
export async function POST(request) {
  const session = getSessionFromRequest(request);

  if (!session || session.role !== "hotel_owner") {
    return NextResponse.json({ error: "Unauthorized. Only Outlet Owners can manage machine credentials." }, { status: 403 });
  }

  const outletId = session.outletId;

  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet) {
    return NextResponse.json({ error: "Outlet not found." }, { status: 404 });
  }

  // Generate machine credentials
  const slug = outlet.slug || outlet.name.toLowerCase().replace(/\s+/g, "_");
  const machineEmail = `machine.${slug}@khandoli.pos`;

  // Generate a strong 12-character password: letters + digits
  const plainPassword = crypto.randomBytes(6).toString("hex"); // 12 hex chars
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const apiToken = crypto.randomBytes(32).toString("hex");

  // Upsert machine credential
  const credential = await prisma.machineCredential.upsert({
    where: { outletId },
    create: {
      outletId,
      machineEmail,
      passwordHash,
      plainPassword,
      apiToken,
    },
    update: {
      machineEmail,
      passwordHash,
      plainPassword,
      apiToken,
      isOnline: false,
      lastHeartbeat: null,
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
    message: "Machine credentials generated and emailed to you.",
    credential: {
      machineEmail,
      machinePassword: plainPassword,
      isOnline: false,
    },
  });
}
