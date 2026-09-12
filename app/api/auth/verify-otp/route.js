import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db.js";
import { createToken, setSessionCookie } from "../../../../lib/auth.js";

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find the most recent unused OTP for this email
    const session = await prisma.otpSession.findFirst({
      where: {
        email: normalizedEmail,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!session) {
      return NextResponse.json(
        { error: "OTP has expired or is invalid. Request a new one." },
        { status: 400 }
      );
    }

    if (session.code !== otp.trim()) {
      return NextResponse.json({ error: "Incorrect OTP. Please try again." }, { status: 400 });
    }

    // Mark OTP as used
    await prisma.otpSession.update({
      where: { id: session.id },
      data: { verified: true },
    });

    // Fetch the full user record
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { outlet: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Account is inactive. Contact your manager." }, { status: 403 });
    }

    // Create JWT session token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      outletId: user.outletId,
      hotelId: user.outlet?.hotelId || null,
      outletName: user.outlet?.name || null,
    };

    const token = createToken(tokenPayload);

    // Determine redirect based on role
    const redirectMap = {
      admin: "/admin",
      franchise_owner: "/dashboard",
      hotel_owner: "/dashboard",
      machine: "/tables",
      waiter: "/tables",
      kitchen: "/kitchen",
    };

    const redirect = redirectMap[user.role] || "/tables";

    // Set session cookie and respond
    const response = NextResponse.json({
      success: true,
      user: tokenPayload,
      redirect,
    });

    return setSessionCookie(response, token);
  } catch (error) {
    console.error("[verify-otp] Error:", error);
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
