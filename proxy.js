import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const access = {
  "/dashboard": ["hotel_owner", "franchise_owner"],
  "/tables": ["machine", "waiter", "hotel_owner", "franchise_owner"],
  "/kitchen": ["machine", "kitchen", "hotel_owner", "franchise_owner"],
  "/menu": ["hotel_owner", "franchise_owner"],
  "/settings": ["hotel_owner"],
  "/admin": ["admin"],
};

function secret() {
  return new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "development-only-khandoli-secret");
}

export async function proxy(request) {
  const requiredRoles = access[request.nextUrl.pathname];
  if (!requiredRoles) return NextResponse.next();

  const token = request.cookies.get("khandoli_session")?.value;
  if (!token) return NextResponse.redirect(new URL(request.nextUrl.pathname === "/admin" ? "/admin-login" : "/login?reason=session", request.url));

  try {
    const { payload } = await jwtVerify(token, secret());
    if (!requiredRoles.includes(payload.role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login?reason=expired", request.url));
    response.cookies.delete("khandoli_session");
    return response;
  }
}

export const config = { matcher: ["/dashboard", "/tables", "/kitchen", "/menu", "/settings", "/admin"] };
