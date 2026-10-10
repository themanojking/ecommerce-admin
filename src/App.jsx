
import { useState } from "react";
import {
  FiMenu,
  FiX,
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiUsers,
  FiSettings,
  FiTrendingUp,
  FiDollarSign,
  FiPackage,
} from "react-icons/fi";

const navigation = [
  { label: "Dashboard", icon: FiHome },
  { label: "Products", icon: FiShoppingBag },
  { label: "Orders", icon: FiShoppingCart },
  { label: "Customers", icon: FiUsers },
  { label: "Settings", icon: FiSettings },
];

const stats = [
  { label: "Total Revenue", value: "₹48,500", icon: FiDollarSign },
  { label: "Total Orders", value: "125", icon: FiShoppingCart },
  { label: "Total Products", value: "48", icon: FiPackage },
  { label: "Growth", value: "+12.5%", icon: FiTrendingUp },
];

const orders = [
  { id: "#ORD001", customer: "Arun Kumar", amount: 2499, status: "Delivered" },
  { id: "#ORD002", customer: "Priya S", amount: 1499, status: "Pending" },
  { id: "#ORD003", customer: "Rahul M", amount: 999, status: "Processing" },
  { id: "#ORD004", customer: "Divya R", amount: 3499, status: "Delivered" },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {menuOpen && (
        <button
          aria-label="Close navigation"
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform duration-300 md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <h1 className="text-xl font-black">
            SHOP<span className="text-indigo-400">ZONE</span>
          </h1>
          <button
            aria-label="Close menu"
            onClick={closeMenu}
            className="rounded-lg p-2 hover:bg-white/10 md:hidden"
          >
            <FiX size={22} />
          </button>
        </div>

        <p className="px-5 pb-2 pt-6 text-xs font-bold uppercase tracking-widest text-slate-400">
          Management
        </p>

        <nav className="flex-1 space-y-2 px-3">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                setActivePage(label);
                closeMenu();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                activePage === label
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4 text-sm text-slate-400">
          Admin Panel · v1.0
        </div>
      </aside>

      <div className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
            >
              <FiMenu size={23} />
            </button>
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                {activePage}
              </h2>
              <p className="hidden text-sm text-slate-500 sm:block">
                Welcome to your store management dashboard.
              </p>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
            A
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {activePage === "Dashboard" ? (
            <>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map(({ label, value, icon: Icon }) => (
                  <article
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">{label}</p>
                      <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                        <Icon size={21} />
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-black">{value}</p>
                  </article>
                ))}
              </section>

              <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b p-5">
                  <h3 className="text-lg font-bold">Recent Orders</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Overview of your latest orders.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Order ID</th>
                        <th className="px-5 py-4 font-semibold">Customer</th>
                        <th className="px-5 py-4 font-semibold">Amount</th>
                        <th className="px-5 py-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-5 py-4 font-semibold">
                            {order.id}
                          </td>
                          <td className="px-5 py-4">{order.customer}</td>
                          <td className="px-5 py-4">
                            ₹{order.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                order.status === "Delivered"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "Pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <section className="rounded-2xl border bg-white p-6 sm:p-8">
              <h3 className="text-xl font-bold">{activePage}</h3>
              <p className="mt-2 text-slate-500">
                This section is ready for implementation.
                We will connect it to the backend API next.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
