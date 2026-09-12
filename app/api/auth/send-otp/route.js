import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db.js";
import { sendOTPEmail } from "../../../../lib/mailer.js";

// Generate a cryptographically safe 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { email } = await request.json();

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
    });
  } catch (error) {
    console.error("[send-otp] Error:", error);
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
