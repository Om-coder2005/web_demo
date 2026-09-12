export const READ_ONLY_ROLES = new Set(["hotel_owner", "franchise_owner"]);

export function canManageFloor(role) {
  return role === "waiter" || role === "machine";
}

export function canManageKitchen(role) {
  return role === "kitchen" || role === "machine";
}
