import { prisma } from "./db.js";

export function isOutletStaffRole(role) {
  return ["hotel_owner", "machine", "waiter", "kitchen"].includes(role);
}

export async function resolveOutletForSession(session, requestedHotelId) {
  if (!session) return null;

  if (isOutletStaffRole(session.role)) {
    if (!session.outletId) return null;
    const outlet = await prisma.outlet.findUnique({ where: { id: session.outletId } });
    if (!outlet) return null;
    if (requestedHotelId && requestedHotelId !== outlet.hotelId && requestedHotelId !== outlet.id) return null;
    return outlet;
  }

  if (session.role === "franchise_owner") {
    const where = requestedHotelId
      ? { OR: [{ hotelId: requestedHotelId }, { id: requestedHotelId }], franchiseOwnerId: session.userId }
      : { franchiseOwnerId: session.userId };
    return prisma.outlet.findFirst({ where });
  }

  if (session.role === "admin" && requestedHotelId) {
    return prisma.outlet.findFirst({ where: { OR: [{ hotelId: requestedHotelId }, { id: requestedHotelId }] } });
  }

  return null;
}

export function canEditOutletMenu(role) {
  return role === "hotel_owner";
}
