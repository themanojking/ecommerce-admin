import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiPackage,
  FiGrid,
  FiShoppingCart,
  FiUsers,
  FiX,
  FiMenu,
  FiLogOut,
  FiChevronRight,
  FiShoppingBag,
  FiMail,
  FiTruck,
} from "react-icons/fi";

const menuItems = [
  { name: "Dashboard", path: "/", icon: FiHome },
  { name: "Products", path: "/admin/products", icon: FiPackage },
  { name: "Categories", path: "/admin/categories", icon: FiGrid },
  { name: "Orders", path: "/admin/orders", icon: FiShoppingCart },
  { name: "Users", path: "/admin/users", icon: FiUsers },
  {
    name: "Shipping Amount",
    path: "/admin/shipping-amount",
    icon: FiTruck,
  },
];

const getAdminUser = () => {
  try {
    const storedUser = localStorage.getItem("adminUser");
    return storedUser ? JSON.parse(storedUser) : {};
  } catch {
    return {};
  }
};

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const admin = getAdminUser();

  const adminName = admin.name || admin.username || "Admin";

  const adminEmail = admin.useremail || admin.email || "";

  const avatarLetter = (
    admin.name?.trim()?.charAt(0) ||
    adminEmail.trim().charAt(0) ||
    "A"
  ).toUpperCase();

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;

    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
        className="fixed left-4 top-4 z-40 rounded-xl bg-indigo-600 p-3 text-white shadow-lg transition hover:bg-indigo-700 active:scale-95 lg:hidden"
      >
        <FiMenu size={21} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-3 left-3 z-50 flex w-60 flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white text-slate-700 shadow-xl transition-transform duration-300 lg:translate-x-0 lg:shadow-lg ${
          mobileOpen ? "translate-x-0" : "-translate-x-[110%]"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200">
              <FiShoppingBag size={20} />
            </div>

            <div>
              <h1 className="text-base font-extrabold leading-tight tracking-tight text-slate-800">
                Admin
                <span className="text-indigo-600">Panel</span>
              </h1>

              <p className="text-[11px] text-slate-400">
                Store management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 lg:hidden"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Main Menu
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                      : "text-slate-500 hover:bg-violet-50 hover:text-violet-700"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                        isActive
                          ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200"
                          : "bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600"
                      }`}
                    >
                      <Icon size={18} />
                    </span>

                    <span className="flex-1">{item.name}</span>

                    <FiChevronRight
                      size={15}
                      className={`transition ${
                        isActive
                          ? "text-indigo-500"
                          : "text-slate-300 group-hover:translate-x-1 group-hover:text-violet-500"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Admin profile */}
        <div className="border-t border-slate-100 p-3">
          <div className="mb-2.5 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-3">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Logged in as
            </p>

            <div className="flex min-w-0 items-center gap-2.5">
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-base font-bold text-white shadow-md shadow-indigo-200">
                {avatarLetter}
              </div>

              {/* Admin name and email */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  {adminName}
                </p>

                <div className="mt-0.5 flex min-w-0 items-center gap-1 text-slate-500">
                  <FiMail
                    size={12}
                    className="shrink-0 text-indigo-500"
                  />

                  <p className="truncate text-[11px]" title={adminEmail}>
                    {adminEmail || "Email not available"}
                  </p>
                </div>
              </div>

              {/* Online indicator */}
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 ring-4 ring-emerald-100"
                title="Logged in"
              />
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 transition group-hover:bg-rose-100">
              <FiLogOut size={18} />
            </span>

            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
