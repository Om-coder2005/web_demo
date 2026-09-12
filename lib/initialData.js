import { INITIAL_MENU } from "../menu_data.js";

export const INITIAL_HOTELS = [
  {
    id: "hotel-1",
    name: "Islampur Branch",
    address: "Main Road, Islampur, Maharashtra",
    ownerName: "Nitin Shinde",
    status: "Active",
    dailyRevenue: 52400,
    activeOrders: 9,
    tableCount: 16,
    staffCount: 11
  },
  {
    id: "hotel-2",
    name: "Kolhapur HQ (Shivaji Udyam Nagar)",
    address: "Shivaji Udyam Nagar, Kolhapur, Maharashtra",
    ownerName: "Abhijeet Shinde",
    status: "Active",
    dailyRevenue: 68900,
    activeOrders: 14,
    tableCount: 22,
    staffCount: 15
  },
  {
    id: "hotel-3",
    name: "Satara Branch",
    address: "Powai Naka, Satara, Maharashtra",
    ownerName: "Siddhesh Kulkarni",
    status: "Active",
    dailyRevenue: 38700,
    activeOrders: 6,
    tableCount: 12,
    staffCount: 8
  },
  {
    id: "hotel-4",
    name: "Pune (Baner Branch)",
    address: "High Street, Baner, Pune, Maharashtra",
    ownerName: "Vikram Patil",
    status: "Active",
    dailyRevenue: 64200,
    activeOrders: 11,
    tableCount: 18,
    staffCount: 12
  }
];


export const INITIAL_STAFF = {
  kitchen: [
    { id: "k1", name: "Chef Ramesh Kumar", role: "Head Chef", shift: "Morning", activeKOTs: 4, rating: "4.9" },
    { id: "k2", name: "Rohan Verma", role: "Line Cook", shift: "Evening", activeKOTs: 3, rating: "4.8" },
    { id: "k3", name: "Chef Sunita Devi", role: "Sous Chef", shift: "Full Day", activeKOTs: 2, rating: "4.9" }
  ],
  waiters: [
    { id: "w1", name: "Sanjay Gupta", role: "Senior Waiter", tablesAssigned: [1, 2, 3], todayOrders: 18, totalSales: 7400 },
    { id: "w2", name: "Ananya Patel", role: "Waiter", tablesAssigned: [4, 5, 6], todayOrders: 14, totalSales: 5800 },
    { id: "w3", name: "Amit Joshi", role: "Junior Waiter", tablesAssigned: [7, 8], todayOrders: 9, totalSales: 3900 }
  ]
};

export { INITIAL_MENU };

export const INITIAL_TABLES = Array.from({ length: 12 }, (_, i) => {
  const tableNum = i + 1;
  let status = "Available";
  let currentOrderId = null;
  
  if (tableNum === 1) {
    status = "Occupied";
    currentOrderId = "kot-101";
  } else if (tableNum === 2) {
    status = "Occupied";
    currentOrderId = "kot-102";
  } else if (tableNum === 5) {
    status = "Billed";
    currentOrderId = "kot-100";
  }

  return {
    id: `table-${tableNum}`,
    number: tableNum,
    capacity: tableNum % 2 === 0 ? 4 : 2,
    status: status, // Available, Occupied, Billed
    currentOrderId: currentOrderId
  };
});

export const INITIAL_ORDERS = [
  {
    id: "kot-101",
    tableNumber: 1,
    waiterName: "Sanjay Gupta",
    timestamp: "12:15 PM",
    createdAt: Date.now() - 1000 * 60 * 12,
    status: "preparing", // preparing, done
    items: [
      { id: "m1", name: "Bread & Butter", quantity: 2, price: 30, status: "preparing" },
      { id: "m10", name: "Cheese Toast", quantity: 2, price: 45, status: "preparing" }
    ],
    notes: "Extra toast crisp please."
  },
  {
    id: "kot-102",
    tableNumber: 2,
    waiterName: "Ananya Patel",
    timestamp: "12:22 PM",
    createdAt: Date.now() - 1000 * 60 * 5,
    status: "preparing",
    items: [
      { id: "m5", name: "Chocolate Toast", quantity: 1, price: 50, status: "preparing" },
      { id: "m7", name: "Veg Aloo Toast", quantity: 1, price: 45, status: "preparing" }
    ],
    notes: "Mild spicy"
  }
];

export const INITIAL_HISTORICAL_ORDERS = [
  {
    id: "kot-099",
    tableNumber: 4,
    waiterName: "Sanjay Gupta",
    timestamp: "11:45 AM",
    completedAt: Date.now() - 1000 * 60 * 35,
    status: "done",
    items: [
      { id: "m3", name: "Bread Butter Jam", quantity: 1, price: 40, status: "done" },
      { id: "m9", name: "Veg Aloo with Cheese Toast", quantity: 2, price: 50, status: "done" }
    ],
    notes: "Completed"
  }
];
