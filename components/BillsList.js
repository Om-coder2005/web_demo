"use client";

import { useEffect, useState } from "react";

export default function BillsList() {
  const [bills, setBills] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(false);

  const fetchBills = async (p) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?status=billed,completed&page=${p}&limit=${limit}`);
      const data = await res.json();
      setBills(data.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(page);
  }, [page]);

  const prev = () => setPage((p) => Math.max(p - 1, 1));
  const next = () => setPage((p) => (bills.length < limit ? p : p + 1));

  return (
    <div className="glass-panel" style={{ padding: "1.5rem" }}>
      <h2 className="font-semibold text-lg mb-4">Bills</h2>
      {loading && (<div className="flex items-center space-x-2"><svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg><span>Loading bills...</span></div>)}
      {!loading && bills.length === 0 && (<p>No bills found.</p>)}
      {!loading && bills.length > 0 && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 sticky top-0">
              <th className="p-2 text-left">Bill #</th>
              <th className="p-2 text-left">Table</th>
              <th className="p-2 text-left">Waiter</th>
              <th className="p-2 text-left">Total</th>
              <th className="p-2 text-left">Billed At</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{b.id}</td>
                <td className="p-2">{b.tableNumber}</td>
                <td className="p-2">{b.waiterName}</td>
                <td className="p-2">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(b.totalAmount)}</td>
                <td className="p-2">{b.billedAt ? new Date(b.billedAt).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex justify-between mt-4">
        <button onClick={prev} disabled={page <= 1} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">Prev</button>
        <span>Page {page}</span>
        <button onClick={next} disabled={bills.length < limit} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}

