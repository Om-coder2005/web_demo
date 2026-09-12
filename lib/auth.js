import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET;

function requireJwtSecret() {
  if (!JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET must be configured in production.");
  }
  return JWT_SECRET || "development-only-khandoli-secret";
}

/**
 * Create a signed JWT session token.
 * @param {object} payload - { userId, email, role, outletId, name }
 * @param {string} expiresIn - e.g. "7d", "24h"
 */
export function createToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, requireJwtSecret(), { expiresIn });
}

/**
 * Verify and decode a JWT token.
 * Returns decoded payload or null if invalid/expired.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, requireJwtSecret());
  } catch {
    return null;
  }
}

/**
 * Extract the session from the request cookies.
 */
export function getSessionFromRequest(request) {
  const cookie = request.cookies?.get("khandoli_session")?.value;
  if (!cookie) return null;
  return verifyToken(cookie);
}

/**
 * Set session cookie in a response.
 */
export function setSessionCookie(response, token) {
  response.cookies.set("khandoli_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return response;
}

/**
 * Clear session cookie.
 */
export function clearSessionCookie(response) {
  response.cookies.set("khandoli_session", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
