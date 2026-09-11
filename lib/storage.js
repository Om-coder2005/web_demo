import { INITIAL_HOTELS, INITIAL_STAFF, INITIAL_MENU, INITIAL_TABLES, INITIAL_ORDERS, INITIAL_HISTORICAL_ORDERS } from "./initialData.js";

const KEYS = {
  USER: "pos_current_user",
  SELECTED_HOTEL: "pos_selected_hotel",
  HOTELS: "pos_hotels_data",
  STAFF: "pos_staff_data",
  MENU: "pos_menu_data",
  TABLES: "pos_tables_data",
  ORDERS: "pos_orders_data",
  HISTORY: "pos_history_orders_data"
};

// Initialize default state in LocalStorage if empty
export function initStorage() {
  if (typeof window === "undefined") return;

  if (!localStorage.getItem(KEYS.HOTELS)) {
    localStorage.setItem(KEYS.HOTELS, JSON.stringify(INITIAL_HOTELS));
  }
  if (!localStorage.getItem(KEYS.STAFF)) {
    localStorage.setItem(KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
  }
  if (!localStorage.getItem(KEYS.MENU)) {
    localStorage.setItem(KEYS.MENU, JSON.stringify(INITIAL_MENU));
  }
  if (!localStorage.getItem(KEYS.TABLES)) {
    localStorage.setItem(KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
  }
  if (!localStorage.getItem(KEYS.ORDERS)) {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
  }
  if (!localStorage.getItem(KEYS.HISTORY)) {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(INITIAL_HISTORICAL_ORDERS));
  }
  if (!localStorage.getItem(KEYS.USER)) {
    // Default logged in user: Hotel Owner for quick demo
    localStorage.setItem(KEYS.USER, JSON.stringify({
      role: "hotel_owner",
      name: "Rajesh Sharma",
      hotelId: "hotel-1",
      hotelName: "Outlet 1 (Main Street)"
    }));
  }
}

// User Auth helpers
export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  initStorage();
  const u = localStorage.getItem(KEYS.USER);
  return u ? JSON.parse(u) : null;
}

export function setCurrentUser(userObj) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.USER, JSON.stringify(userObj));
  window.dispatchEvent(new Event("pos_user_change"));
}

export function getSelectedHotel() {
  if (typeof window === "undefined") return null;
  initStorage();
  const val = localStorage.getItem(KEYS.SELECTED_HOTEL);
  if (val) return JSON.parse(val);
  const hotels = getHotels();
  return hotels[0] || null;
}

export function setSelectedHotel(hotelObj) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.SELECTED_HOTEL, JSON.stringify(hotelObj));
  window.dispatchEvent(new Event("pos_hotel_change"));
}

// Data getters & setters
export function getHotels() {
  if (typeof window === "undefined") return INITIAL_HOTELS;
  initStorage();
  return JSON.parse(localStorage.getItem(KEYS.HOTELS)) || INITIAL_HOTELS;
}

export function getStaff() {
  if (typeof window === "undefined") return INITIAL_STAFF;
  initStorage();
  return JSON.parse(localStorage.getItem(KEYS.STAFF)) || INITIAL_STAFF;
}

export function getMenu() {
  if (typeof window === "undefined") return INITIAL_MENU;
  initStorage();
  return JSON.parse(localStorage.getItem(KEYS.MENU)) || INITIAL_MENU;
}

export function setMenu(newMenu) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.MENU, JSON.stringify(newMenu));
  window.dispatchEvent(new Event("pos_data_update"));
}

export function getTables() {
  if (typeof window === "undefined") return INITIAL_TABLES;
  initStorage();
  return JSON.parse(localStorage.getItem(KEYS.TABLES)) || INITIAL_TABLES;
}

export function setTables(newTables) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.TABLES, JSON.stringify(newTables));
  window.dispatchEvent(new Event("pos_data_update"));
}

export function getOrders() {
  if (typeof window === "undefined") return INITIAL_ORDERS;
  initStorage();
  return JSON.parse(localStorage.getItem(KEYS.ORDERS)) || INITIAL_ORDERS;
}

export function setOrders(newOrders) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(newOrders));
  window.dispatchEvent(new Event("pos_data_update"));
}

export function getHistoryOrders() {
  if (typeof window === "undefined") return INITIAL_HISTORICAL_ORDERS;
  initStorage();
  return JSON.parse(localStorage.getItem(KEYS.HISTORY)) || INITIAL_HISTORICAL_ORDERS;
}

export function setHistoryOrders(newHistory) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(newHistory));
  window.dispatchEvent(new Event("pos_data_update"));
}
