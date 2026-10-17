import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FiPackage,
  FiShoppingCart,
  FiClock,
  FiAlertTriangle,
  FiRefreshCw,
  FiArrowUpRight,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiInbox,
  FiActivity,
  FiUser,
  FiCalendar,
  FiCreditCard,
  FiTag,
  FiTruck,
  FiSettings,
  FiThumbsUp,
  FiMail,
} from "react-icons/fi";

import api from "../services/api";
import NotificationsBell from "../components/NotificationsBell";
import DashboardChart from "../components/DashboardChart";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Always return the category NAME only (never the id).
const getCategoryName = (category) => {
  if (!category) return "";
  if (typeof category === "string") return category;
  return category.name || category.categoryName || category.title || "";
};

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  Processing: "bg-violet-50 text-violet-700 ring-violet-200",
  Shipped: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

const statusIcons = {
  Pending: FiClock,
  Confirmed: FiThumbsUp,
  Processing: FiSettings,
  Shipped: FiTruck,
  Delivered: FiCheckCircle,
  Cancelled: FiXCircle,
};

const statCards = [
  {
    key: "totalProducts",
    title: "Total Products",
    description: "Products in your store",
    icon: FiPackage,
    gradient: "from-indigo-500 to-violet-600",
    glow: "bg-indigo-500/10",
    bar: "from-indigo-500 to-violet-500",
    valueStyle: "text-slate-900",
  },
  {
    key: "totalOrders",
    title: "Total Orders",
    description: "All orders received",
    icon: FiShoppingCart,
    gradient: "from-sky-500 to-blue-600",
    glow: "bg-sky-500/10",
    bar: "from-sky-500 to-blue-500",
    valueStyle: "text-slate-900",
  },
  {
    key: "pendingOrders",
    title: "Pending Orders",
    description: "Orders awaiting action",
    icon: FiClock,
    gradient: "from-amber-400 to-orange-500",
    glow: "bg-amber-500/10",
    bar: "from-amber-400 to-orange-500",
    valueStyle: "text-amber-700",
  },
  {
    key: "totalRevenue",
    title: "Order Revenue",
    description: "Excluding cancelled orders",
    icon: FiDollarSign,
    gradient: "from-emerald-500 to-teal-600",
    glow: "bg-emerald-500/10",
    bar: "from-emerald-500 to-teal-500",
    valueStyle: "text-emerald-700",
    currency: true,
  },
];

/* Animated count-up number */
function CountUp({ value, currency = false }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || target === 0) {
      setDisplay(target);
      return;
    }

    const duration = 900;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return currency
    ? formatCurrency(display)
    : Math.round(display).toLocaleString("en-IN");
}

function StatusBadge({ status }) {
  const Icon = statusIcons[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${
        statusStyles[status] || "bg-slate-50 text-slate-600 ring-slate-200"
      }`}
    >
      {Icon ? (
        <Icon size={13} />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      )}
      {status}
    </span>
  );
}

function StockBadge({ stock }) {
  const quantity = Number(stock) || 0;
  const out = quantity <= 0;

  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold ${
          out ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        <FiAlertTriangle size={12} />
        {out ? "Out of stock" : `${quantity} left`}
      </span>

      <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 md:block">
        <div
          className={`h-full rounded-full ${
            out ? "bg-rose-500" : "bg-amber-500"
          }`}
          style={{ width: `${Math.max((quantity / 5) * 100, out ? 4 : 10)}%` }}
        />
      </div>
    </div>
  );
}

function LoadingRows({ count = 3 }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="h-10 animate-pulse rounded-lg bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    lowStockCount: 0,
  });

  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 30,
    });
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/admin/dashboard/stats");

      if (data.success === false) {
        throw new Error(data.message || "Unable to load dashboard statistics.");
      }

      const dashboardStats = data.stats || {};
      const stockProducts = Array.isArray(data.lowStockProducts)
        ? data.lowStockProducts
        : [];
      const orders = Array.isArray(data.recentOrders) ? data.recentOrders : [];

      setStats({
        totalProducts: Number(dashboardStats.totalProducts) || 0,
        totalOrders: Number(dashboardStats.totalOrders) || 0,
        pendingOrders: Number(dashboardStats.pendingOrders) || 0,
        totalRevenue: Number(dashboardStats.totalRevenue) || 0,
        lowStockCount:
          dashboardStats.lowStockCount != null
            ? Number(dashboardStats.lowStockCount) || 0
            : stockProducts.length,
      });

      setLowStockProducts(stockProducts);
      setRecentOrders(orders);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load dashboard. Please check your connection and admin login."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Re-scan AOS elements after data changes
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => AOS.refreshHard(), 100);
      return () => clearTimeout(t);
    }
  }, [loading, lowStockProducts, recentOrders]);

  const handleRefresh = () => {
    setRefreshKey((previous) => previous + 1);
    loadDashboard();
  };

  const firstLoad = loading && !lastUpdated;

  return (
    <div className="w-full min-w-0 space-y-5 overflow-x-hidden pt-14 text-slate-800 sm:space-y-6 lg:pt-0">
      <style>{`
        @keyframes dbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.06); }
        }
        @keyframes dbPing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .db-float { animation: dbFloat 6s ease-in-out infinite; }
        .db-float-slow { animation: dbFloat 8s ease-in-out infinite reverse; }
        .db-ping { animation: dbPing 1.8s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .db-float, .db-float-slow, .db-ping { animation: none; }
        }
      `}</style>

      {/* Dashboard header */}
      <header
        data-aos="fade-down"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-5 text-white shadow-xl shadow-teal-900/20 sm:p-8"
      >
        <div className="db-float pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="db-float-slow pointer-events-none absolute -bottom-12 left-1/3 h-44 w-44 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute right-24 top-6 hidden h-24 w-24 rounded-full border border-white/10 sm:block" />
        <div className="pointer-events-none absolute right-32 top-14 hidden h-12 w-12 rounded-full border border-white/10 sm:block" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p
              data-aos="fade-right"
              data-aos-delay="100"
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.18em] backdrop-blur sm:text-xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="db-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              </span>
              <FiActivity size={13} />
              STORE OVERVIEW
            </p>

            <h1
              data-aos="fade-right"
              data-aos-delay="200"
              className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl"
            >
              Dashboard
            </h1>

            <p
              data-aos="fade-right"
              data-aos-delay="300"
              className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/90"
            >
              Monitor your products, orders, revenue, and inventory in one
              place.
            </p>
          </div>

          <div
            data-aos="fade-left"
            data-aos-delay="300"
            className="flex flex-col items-start gap-2 sm:items-end"
          >
            <div className="flex items-center gap-3">
              <NotificationsBell refreshKey={refreshKey} />

              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-700 shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiRefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                {loading ? "Refreshing..." : "Refresh data"}
              </button>
            </div>

            {lastUpdated && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-100/80">
                <FiClock size={12} />
                Updated {lastUpdated.toLocaleTimeString("en-IN")}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Dashboard error */}
      {error && (
        <div
          role="alert"
          data-aos="zoom-in"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          <FiAlertTriangle className="mt-0.5 shrink-0" size={19} />

          <div className="min-w-0 flex-1">
            <p className="font-bold">Dashboard could not be loaded</p>
            <p className="mt-1 break-words">{error}</p>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2 disabled:opacity-50"
            >
              <FiRefreshCw size={13} />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Statistics cards */}
      <section
        aria-label="Store statistics"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
      >
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const value = stats[card.key];

          return (
            <article
              key={card.key}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-5 xl:p-6"
            >
              <div
                className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full transition-transform duration-500 group-hover:scale-150 ${card.glow}`}
              />

              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  {firstLoad ? (
                    <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-slate-100" />
                  ) : (
                    <p
                      className={`mt-3 break-words text-2xl font-extrabold tracking-tight xl:text-3xl ${card.valueStyle}`}
                    >
                      <CountUp value={value} currency={card.currency} />
                    </p>
                  )}
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 sm:h-12 sm:w-12 ${card.gradient}`}
                >
                  <Icon size={22} />
                </div>
              </div>

              <p className="relative mt-4 text-xs leading-5 text-slate-400">
                {card.description}
              </p>

              {/* Animated accent bar */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-100">
                <div
                  className={`h-full w-0 bg-gradient-to-r transition-all duration-700 group-hover:w-full ${card.bar}`}
                />
              </div>
            </article>
          );
        })}
      </section>

      {/* Separate chart component */}
      <div data-aos="fade-up">
        <DashboardChart />
      </div>

      {/* Low stock alerts */}
      <section
        data-aos="fade-up"
        className="min-w-0 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
              <FiAlertTriangle size={21} />
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-slate-800">Low Stock Alerts</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Products with 5 or fewer items in stock
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-800">
            <FiPackage size={14} />
            {stats.lowStockCount}{" "}
            {stats.lowStockCount === 1 ? "item" : "items"}
          </span>
        </div>

        {firstLoad ? (
          <LoadingRows count={3} />
        ) : lowStockProducts.length === 0 ? (
          <div className="flex items-center gap-3 p-5 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <FiCheckCircle size={20} />
            </div>
            <p className="text-sm text-slate-600">
              All good! No low-stock products found.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile stock list */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {lowStockProducts.map((product, index) => (
                <li
                  key={product._id}
                  data-aos="fade-left"
                  data-aos-delay={Math.min(index, 5) * 60}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-700">
                      {product.productName}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <FiTag size={11} />
                      {getCategoryName(product.category) || "—"}
                    </p>
                  </div>

                  <StockBadge stock={product.stock} />
                </li>
              ))}
            </ul>

            {/* Desktop stock table */}
            <div className="hidden w-full overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Product</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Stock left</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {lowStockProducts.map((product) => (
                    <tr
                      key={product._id}
                      className="transition-colors hover:bg-amber-50/50"
                    >
                      <td className="max-w-[260px] break-words px-5 py-4">
                        <span className="flex items-center gap-3 font-semibold text-slate-700">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                            <FiPackage size={16} />
                          </span>
                          {product.productName}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                          <FiTag size={11} />
                          {getCategoryName(product.category) || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StockBadge stock={product.stock} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Recent orders */}
      <section
        data-aos="fade-up"
        className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
              <FiShoppingCart size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold">Recent Orders</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Your five latest orders with product quantities
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="group inline-flex w-fit shrink-0 items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-600 hover:text-white"
          >
            View all orders
            <FiArrowUpRight
              size={16}
              className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </button>
        </div>

        {firstLoad ? (
          <LoadingRows count={4} />
        ) : recentOrders.length === 0 ? (
          <div data-aos="zoom-in" className="flex flex-col items-center px-5 py-10 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-500">
              <FiInbox size={24} />
            </div>
            <p className="font-semibold text-slate-700">No orders yet</p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
              Orders will appear here when customers place them.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile order cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {recentOrders.map((order, orderIndex) => {
                const customerName =
                  order.user?.name ||
                  order.user?.useremail ||
                  order.shippingAddress?.name ||
                  "Customer";

                const status = order.status || "Pending";
                const orderItems = Array.isArray(order.orderItems)
                  ? order.orderItems
                  : [];

                const totalQuantity = orderItems.reduce(
                  (total, item) => total + Number(item.quantity || 0),
                  0
                );

                return (
                  <li
                    key={order._id}
                    data-aos="fade-up"
                    data-aos-delay={Math.min(orderIndex, 4) * 70}
                    className="space-y-3 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-sm font-bold text-white">
                          {customerName.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-slate-800">
                            {customerName}
                          </p>
                          {order.user?.useremail && (
                            <p className="mt-0.5 flex items-center gap-1 break-all text-xs text-slate-400">
                              <FiMail size={11} className="shrink-0" />
                              {order.user.useremail}
                            </p>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                          <FiPackage size={13} />
                          Ordered Products
                        </p>
                        <span className="shrink-0 rounded-full bg-teal-100 px-2 py-1 text-[11px] font-semibold text-teal-700">
                          {totalQuantity} items
                        </span>
                      </div>

                      {orderItems.length > 0 ? (
                        <ul className="space-y-2">
                          {orderItems.map((item, index) => (
                            <li
                              key={item.product?._id || item._id || index}
                              className="flex items-start justify-between gap-3 text-sm"
                            >
                              <span className="min-w-0 break-words text-slate-700">
                                {item.product?.productName ||
                                  item.productName ||
                                  "Product"}
                              </span>
                              <span className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-700">
                                × {item.quantity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Product details unavailable
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-3 text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <FiCalendar size={12} />
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FiCreditCard size={12} />
                          {order.paymentMethod || "COD"}
                        </span>
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {formatCurrency(order.totalPrice)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop orders table */}
            <div className="hidden w-full overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <FiUser size={13} /> Customer
                      </span>
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <FiPackage size={13} /> Products & Qty
                      </span>
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <FiCalendar size={13} /> Date
                      </span>
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <FiDollarSign size={13} /> Amount
                      </span>
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <FiCreditCard size={13} /> Payment
                      </span>
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <FiActivity size={13} /> Status
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => {
                    const customerName =
                      order.user?.name ||
                      order.user?.useremail ||
                      order.shippingAddress?.name ||
                      "Customer";

                    const status = order.status || "Pending";
                    const orderItems = Array.isArray(order.orderItems)
                      ? order.orderItems
                      : [];

                    const totalQuantity = orderItems.reduce(
                      (total, item) => total + Number(item.quantity || 0),
                      0
                    );

                    return (
                      <tr
                        key={order._id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="max-w-[220px] break-words px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-sm font-bold text-white">
                              {customerName.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800">
                                {customerName}
                              </p>
                              {order.user?.useremail && (
                                <p className="mt-0.5 break-all text-xs text-slate-400">
                                  {order.user.useremail}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="max-w-[280px] px-5 py-4">
                          <div className="space-y-2">
                            {orderItems.length > 0 ? (
                              orderItems.map((item, index) => (
                                <div
                                  key={item.product?._id || item._id || index}
                                  className="flex items-start justify-between gap-3"
                                >
                                  <span className="min-w-0 break-words text-slate-700">
                                    {item.product?.productName ||
                                      item.productName ||
                                      "Product"}
                                  </span>
                                  <span className="shrink-0 rounded-md bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700">
                                    × {item.quantity}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">
                                Product details unavailable
                              </span>
                            )}

                            <p className="border-t border-slate-100 pt-2 text-xs font-semibold text-slate-500">
                              Total quantity: {totalQuantity}
                            </p>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-800">
                          {formatCurrency(order.totalPrice)}
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                            <FiCreditCard size={12} />
                            {order.paymentMethod || "COD"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}