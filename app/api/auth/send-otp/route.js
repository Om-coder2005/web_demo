import 'dotenv/config';
import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../../../../lib/db.js";
import { sendOTPEmail } from "../../../../lib/mailer.js";
import crypto from "crypto";

// Generate a cryptographically safe 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    let payload;
    try {
      payload = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    const { email } = payload;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify the user exists in the database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { outlet: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "No active account found with this email. Contact your manager." },
        { status: 404 }
      );
    }

    // Invalidate all previous unused OTPs for this email
    await prisma.otpSession.updateMany({
      where: { email: normalizedEmail, verified: false },
      data: { verified: true }, // marks as used/invalid
    });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in DB
    await prisma.otpSession.create({
      data: {
        email: normalizedEmail,
        code: otp,
        expiresAt,
      },
    });

    // Send branded OTP email
    await sendOTPEmail({
      to: normalizedEmail,
      otp,
      outletName: user.outlet?.name || "Khandoli Nitin's Canteen",
    });

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${normalizedEmail}. Valid for 10 minutes.`,
      role: user.role,
      name: user.name,
      ...(process.env.NODE_ENV === "development" ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error("[send-otp] Error:", error);
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
