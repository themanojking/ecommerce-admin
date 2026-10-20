import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FiPackage,
  FiRefreshCw,
  FiEye,
  FiX,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiThumbsUp,
  FiTruck,
  FiCalendar,
  FiCreditCard,
  FiMapPin,
  FiMail,
  FiPhone,
  FiShoppingBag,
  FiList,
  FiEdit3,
} from "react-icons/fi";
import api from "../services/api";

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

// Normal progress of an order (Cancelled is shown separately)
const PROGRESS_STEPS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
];

const statusIcons = {
  Pending: FiClock,
  Confirmed: FiThumbsUp,
  Processing: FiSettings,
  Shipped: FiTruck,
  Delivered: FiCheckCircle,
  Cancelled: FiXCircle,
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "-";

const statusColors = {
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Processing: "bg-indigo-100 text-indigo-700",
  Shipped: "bg-purple-100 text-purple-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const getOrderSubtotal = (order) => {
  if (order.itemsPrice != null) {
    return Number(order.itemsPrice) || 0;
  }

  return (order.orderItems || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
};

const getShippingPrice = (order) => {
  if (order.shippingPrice != null) {
    return Number(order.shippingPrice) || 0;
  }

  return Math.max(0, (Number(order.totalPrice) || 0) - getOrderSubtotal(order));
};

const getFinalTotal = (order) => {
  if (order.totalPrice != null) {
    return Number(order.totalPrice) || 0;
  }

  return getOrderSubtotal(order) + getShippingPrice(order);
};

const getProductName = (item) => {
  if (item.product && typeof item.product === "object") {
    return (
      item.product.productName ||
      item.product.name ||
      item.productName ||
      "Product"
    );
  }

  return item.productName || "Product";
};

const getCustomerName = (order) =>
  order.shippingAddress?.name || order.user?.name || "Customer";

const getCustomerEmail = (order) =>
  order.shippingAddress?.useremail || order.user?.useremail || "";

const StatusBadge = ({ status }) => {
  const Icon = statusIcons[status] || FiClock;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        statusColors[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      <Icon size={12} className="shrink-0" />
      {status || "Pending"}
    </span>
  );
};

const Avatar = ({ name, size = "h-10 w-10" }) => (
  <span
    className={`${size} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md`}
  >
    {(name || "C").trim().charAt(0).toUpperCase()}
  </span>
);

const OrderStatusSelect = ({ order, updatingId, onChange, id }) => (
  <div className="relative w-full sm:w-auto">
    <select
      id={id}
      value={order.status || "Pending"}
      disabled={updatingId === order._id}
      onChange={(event) => onChange(order._id, event.target.value)}
      className={`w-full min-w-0 cursor-pointer rounded-lg border-0 px-2 py-2 text-xs font-semibold outline-none ring-1 ring-gray-200 transition focus:ring-2 focus:ring-indigo-500 disabled:cursor-wait disabled:opacity-50 sm:w-auto ${
        statusColors[order.status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {ORDER_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
    {updatingId === order._id && (
      <FiRefreshCw
        size={12}
        className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-gray-500"
      />
    )}
  </div>
);

/* Visual progress of an order */
const OrderProgress = ({ status }) => {
  if (status === "Cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
        <FiXCircle size={20} className="shrink-0" />
        <p className="font-medium">This order was cancelled.</p>
      </div>
    );
  }

  const currentIndex = Math.max(PROGRESS_STEPS.indexOf(status || "Pending"), 0);

  return (
    <ol className="flex items-start">
      {PROGRESS_STEPS.map((step, index) => {
        const Icon = statusIcons[step];
        const done = index <= currentIndex;
        const last = index === PROGRESS_STEPS.length - 1;

        return (
          <li key={step} className="relative flex flex-1 flex-col items-center">
            {!last && (
              <span
                className={`absolute left-1/2 top-4 h-0.5 w-full transition-colors duration-500 ${
                  index < currentIndex ? "bg-indigo-500" : "bg-gray-200"
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-500 ${
                done
                  ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-400"
              } ${index === currentIndex ? "ring-4 ring-indigo-100" : ""}`}
            >
              <Icon size={14} />
            </span>
            <span
              className={`mt-1.5 hidden text-[10px] font-medium sm:block ${
                done ? "text-indigo-700" : "text-gray-400"
              }`}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    AOS.init({
      duration: 650,
      easing: "ease-out-cubic",
      once: true,
      offset: 30,
    });
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/admin/orders");
      const fetchedOrders = data.orders || [];

      setOrders(fetchedOrders);

      setSelectedOrder((current) =>
        current
          ? fetchedOrders.find((order) => order._id === current._id) || current
          : null
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, status) => {
    try {
      setUpdatingId(orderId);

      const { data } = await api.put(`/admin/orders/${orderId}/status`, {
        status,
      });

      const updatedOrder = data.order;

      setOrders((previous) =>
        previous.map((order) =>
          order._id === orderId ? { ...order, ...updatedOrder } : order
        )
      );

      setSelectedOrder((previous) =>
        previous?._id === orderId ? { ...previous, ...updatedOrder } : previous
      );

      toast.success("Order status updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders =
    filter === "All"
      ? orders
      : orders.filter((order) => order.status === filter);

  const countByStatus = (status) =>
    orders.filter((order) => order.status === status).length;

  const summary = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: FiShoppingBag,
      gradient: "from-indigo-500 to-violet-600",
      glow: "bg-indigo-500/10",
    },
    {
      label: "Pending",
      value: countByStatus("Pending"),
      icon: FiClock,
      gradient: "from-amber-400 to-orange-500",
      glow: "bg-amber-500/10",
    },
    {
      label: "Processing",
      value: countByStatus("Processing"),
      icon: FiSettings,
      gradient: "from-sky-500 to-blue-600",
      glow: "bg-sky-500/10",
    },
    {
      label: "Delivered",
      value: countByStatus("Delivered"),
      icon: FiCheckCircle,
      gradient: "from-emerald-500 to-teal-600",
      glow: "bg-emerald-500/10",
    },
  ];

  // Re-scan AOS whenever the visible list changes
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => AOS.refreshHard(), 100);
      return () => clearTimeout(t);
    }
  }, [loading, filter, orders.length]);

  // Escape closes the details popup and page scroll is locked while open
  useEffect(() => {
    if (!selectedOrder) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedOrder(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedOrder]);

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-gradient-to-b from-gray-50 to-white p-3 sm:p-5 lg:p-6 xl:p-8">
      <style>{`
        @keyframes ordModalIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ordFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ordFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .ord-modal-in { animation: ordModalIn 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
        .ord-fade { animation: ordFade 0.25s ease-out; }
        .ord-float { animation: ordFloat 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ord-modal-in, .ord-fade, .ord-float { animation: none; }
        }
      `}</style>

      <div className="mx-auto w-full min-w-0 max-w-[1600px]">
        {/* Header */}
        <header
          data-aos="fade-down"
          className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 text-white shadow-xl shadow-indigo-900/20 sm:mb-6 sm:p-8"
        >
          <div className="ord-float pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-fuchsia-300/20 blur-3xl" />

          <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p
                data-aos="fade-right"
                data-aos-delay="100"
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur"
              >
                <FiTruck size={13} />
                Fulfilment
              </p>

              <h1
                data-aos="fade-right"
                data-aos-delay="200"
                className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:gap-3 sm:text-3xl lg:text-4xl"
              >
                <FiPackage className="shrink-0" />
                <span>Order Management</span>
              </h1>

              <p
                data-aos="fade-right"
                data-aos-delay="300"
                className="mt-2 text-sm leading-6 text-indigo-50/90"
              >
                View customer orders and manage their status.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchOrders}
              disabled={loading}
              data-aos="fade-left"
              data-aos-delay="300"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-xl active:scale-95 disabled:opacity-60 sm:w-auto"
            >
              <FiRefreshCw
                className={
                  loading
                    ? "animate-spin"
                    : "transition-transform duration-500 group-hover:rotate-180"
                }
              />
              Refresh Orders
            </button>
          </div>
        </header>

        {/* Summary cards */}
        <section
          aria-label="Order statistics"
          className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-4"
        >
          {summary.map(({ label, value, icon: Icon, gradient, glow }, index) => (
            <article
              key={label}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="group relative min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5"
            >
              <div
                className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full transition-transform duration-500 group-hover:scale-150 ${glow}`}
              />

              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words text-xs text-gray-500 sm:text-sm">
                    {label}
                  </p>
                  {loading ? (
                    <div className="mt-3 h-7 w-12 animate-pulse rounded-lg bg-gray-100" />
                  ) : (
                    <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-gray-900 sm:mt-2 sm:text-3xl">
                      {value.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 sm:h-11 sm:w-11 ${gradient}`}
                >
                  <Icon size={19} />
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Filters */}
        <section data-aos="fade-up" className="mb-4 min-w-0">
          <div className="flex flex-wrap gap-2">
            {["All", ...ORDER_STATUSES].map((status) => {
              const Icon = status === "All" ? FiList : statusIcons[status];
              const count =
                status === "All" ? orders.length : countByStatus(status);

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  aria-pressed={filter === status}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition duration-300 active:scale-95 sm:px-4 sm:text-sm ${
                    filter === status
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-300/50"
                      : "border border-gray-200 bg-white text-gray-600 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700"
                  }`}
                >
                  <Icon size={13} />
                  {status}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      filter === status
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Orders */}
        <section
          data-aos="fade-up"
          className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div data-aos="zoom-in" className="px-4 py-14 text-center sm:py-16">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <FiPackage size={28} />
              </span>
              <h3 className="mt-4 font-semibold text-gray-800">
                No orders found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Orders matching this filter will appear here.
              </p>
              {filter !== "All" && (
                <button
                  type="button"
                  onClick={() => setFilter("All")}
                  className="mt-5 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 active:scale-95"
                >
                  Show all orders
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile and tablet cards */}
              <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 md:p-4 lg:hidden">
                {filteredOrders.map((order, index) => (
                  <article
                    key={order._id}
                    data-aos="fade-up"
                    data-aos-delay={Math.min(index % 4, 3) * 80}
                    className="min-w-0 rounded-2xl border border-gray-200 p-3.5 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={getCustomerName(order)} />
                        <div className="min-w-0">
                          <p className="break-all text-sm font-bold text-gray-900">
                            #{order._id.slice(-8).toUpperCase()}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                            <FiCalendar size={11} />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="mt-1 break-words font-medium text-gray-800">
                          {getCustomerName(order)}
                        </p>
                        <p className="flex items-center gap-1 break-all text-xs text-gray-500">
                          <FiMail size={11} className="shrink-0" />
                          {getCustomerEmail(order) || "-"}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                          <FiShoppingBag size={12} />
                          Products & Quantity
                        </p>
                        <div className="space-y-2">
                          {(order.orderItems || []).map((item, itemIndex) => (
                            <div
                              key={item._id || `${order._id}-${itemIndex}`}
                              className="flex min-w-0 items-start justify-between gap-3"
                            >
                              <p className="min-w-0 break-words text-gray-800">
                                {getProductName(item)}
                              </p>
                              <span className="shrink-0 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-bold text-gray-700">
                                × {item.quantity}
                              </span>
                            </div>
                          ))}
                          {!order.orderItems?.length && (
                            <p className="text-xs text-gray-400">
                              No product details
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="mt-1 break-words font-bold text-gray-900">
                            {formatPrice(getFinalTotal(order))}
                          </p>
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="text-xs text-gray-500">Payment</p>
                          <p className="mt-1 inline-flex items-center gap-1 break-words text-sm text-gray-800">
                            <FiCreditCard size={13} />
                            {order.paymentMethod || "COD"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] items-end gap-2 border-t border-gray-100 pt-3">
                        <div className="min-w-0">
                          <label
                            htmlFor={`status-${order._id}`}
                            className="mb-1.5 block text-xs text-gray-500"
                          >
                            Update status
                          </label>
                          <OrderStatusSelect
                            order={order}
                            updatingId={updatingId}
                            onChange={handleStatusChange}
                            id={`status-${order._id}`}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="group inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-100 px-3 py-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-600 hover:text-white active:scale-95 sm:text-sm"
                        >
                          <FiEye className="transition-transform group-hover:scale-110" />
                          View
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Laptop and desktop compact table */}
              <div className="hidden lg:block">
                <table className="w-full table-fixed text-left text-xs xl:text-sm">
                  <colgroup>
                    <col className="w-[10%]" />
                    <col className="w-[16%]" />
                    <col className="w-[10%]" />
                    <col className="w-[20%]" />
                    <col className="w-[10%]" />
                    <col className="w-[11%]" />
                    <col className="w-[13%]" />
                    <col className="w-[10%]" />
                  </colgroup>

                  <thead className="bg-gray-50 text-[10px] uppercase text-gray-600 xl:text-xs">
                    <tr>
                      {[
                        { label: "Order", icon: FiPackage },
                        { label: "Customer", icon: FiMail },
                        { label: "Date", icon: FiCalendar },
                        { label: "Products & Qty", icon: FiShoppingBag },
                        { label: "Payment", icon: FiCreditCard },
                        { label: "Total", icon: null },
                        { label: "Status", icon: FiTruck },
                        { label: "Actions", icon: null },
                      ].map(({ label, icon: Icon }) => (
                        <th
                          key={label}
                          className="px-2 py-3 font-semibold xl:px-3 xl:py-4"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {Icon && <Icon size={12} />}
                            {label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order, index) => (
                      <tr
                        key={order._id}
                        data-aos="fade"
                        data-aos-delay={Math.min(index, 8) * 40}
                        className="transition hover:bg-indigo-50/40"
                      >
                        <td className="break-words px-2 py-3 font-semibold text-gray-800 xl:px-3">
                          #{order.orderNumber}
                        </td>

                        <td className="min-w-0 px-2 py-3 xl:px-3">
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={getCustomerName(order)}
                              size="h-8 w-8"
                            />
                            <div className="min-w-0">
                              <p className="break-words font-medium text-gray-800">
                                {getCustomerName(order)}
                              </p>
                              <p className="mt-0.5 break-all text-[10px] text-gray-500 xl:text-xs">
                                {getCustomerEmail(order) || "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="break-words px-2 py-3 text-gray-600 xl:px-3">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="min-w-0 px-2 py-3 xl:px-3">
                          <div className="space-y-2">
                            {(order.orderItems || []).map((item, itemIndex) => (
                              <div
                                key={item._id || `${order._id}-${itemIndex}`}
                                className="flex min-w-0 items-start justify-between gap-2"
                              >
                                <p className="min-w-0 break-words font-medium text-gray-800">
                                  {getProductName(item)}
                                </p>
                                <span className="shrink-0 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 xl:text-xs">
                                  × {item.quantity}
                                </span>
                              </div>
                            ))}
                            {!order.orderItems?.length && (
                              <span className="text-gray-400">
                                No product details
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-2 py-3 text-gray-600 xl:px-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] xl:text-xs">
                            <FiCreditCard size={11} />
                            {order.paymentMethod || "COD"}
                          </span>
                        </td>

                        <td className="break-words px-2 py-3 font-semibold text-gray-900 xl:px-3">
                          {formatPrice(getFinalTotal(order))}
                        </td>

                        <td className="px-2 py-3 xl:px-3">
                          <OrderStatusSelect
                            order={order}
                            updatingId={updatingId}
                            onChange={handleStatusChange}
                            id={`desktop-status-${order._id}`}
                          />
                        </td>

                        <td className="px-2 py-3 xl:px-3">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="group inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-100 px-2 py-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-600 hover:text-white active:scale-95 xl:gap-1.5 xl:px-3"
                          >
                            <FiEye className="transition-transform group-hover:scale-110" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <p className="mt-3 text-xs text-gray-500 sm:mt-4 sm:text-sm">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
      </div>

      {/* Order details modal */}
      {selectedOrder && (
        <div
          className="ord-fade fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-5"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            className="ord-modal-in my-auto max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                  <FiPackage size={20} />
                </span>
                <div className="min-w-0">
                  <h2
                    id="order-modal-title"
                    className="text-lg font-bold text-gray-900 sm:text-xl"
                  >
                    Order Details
                  </h2>
                  <p className="mt-0.5 break-all text-xs text-gray-500 sm:text-sm">
                    #{selectedOrder._id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:rotate-90 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close order details"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-5 p-4 sm:space-y-6 sm:p-5">
              {/* Progress */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                  <FiTruck className="text-indigo-600" />
                  Order Progress
                </h3>
                <OrderProgress status={selectedOrder.status || "Pending"} />
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                  <FiMapPin className="text-indigo-600" />
                  Shipping Address
                </h3>

                <div className="flex gap-3 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                  <Avatar name={getCustomerName(selectedOrder)} />
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-gray-900">
                      {getCustomerName(selectedOrder)}
                    </p>
                    {getCustomerEmail(selectedOrder) && (
                      <p className="flex items-center gap-1.5 break-all">
                        <FiMail size={13} className="shrink-0" />
                        {getCustomerEmail(selectedOrder)}
                      </p>
                    )}
                    {selectedOrder.shippingAddress?.phone && (
                      <p className="flex items-center gap-1.5">
                        <FiPhone size={13} className="shrink-0" />
                        {selectedOrder.shippingAddress.phone}
                      </p>
                    )}
                    <p className="break-words">
                      {selectedOrder.shippingAddress?.address}
                    </p>
                    <p className="break-words">
                      {[
                        selectedOrder.shippingAddress?.city,
                        selectedOrder.shippingAddress?.state,
                        selectedOrder.shippingAddress?.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p>{selectedOrder.shippingAddress?.country}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                  <FiShoppingBag className="text-indigo-600" />
                  Ordered Products
                </h3>

                <div className="space-y-3">
                  {selectedOrder.orderItems?.map((item, index) => (
                    <div
                      key={item._id || `${selectedOrder._id}-${index}`}
                      className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-gray-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/30"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <FiPackage size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="break-words font-medium text-gray-800">
                            {getProductName(item)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-xs text-gray-500 sm:text-sm">
                            Unit price: {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 text-sm font-semibold text-gray-900">
                        {formatPrice(
                          Number(item.price || 0) * Number(item.quantity || 0)
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl bg-gray-50 p-4">
                <div className="flex justify-between gap-3 py-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <FiCreditCard size={14} />
                    Payment method
                  </span>
                  <span className="text-right font-medium text-gray-900">
                    {selectedOrder.paymentMethod || "COD"}
                  </span>
                </div>
                <div className="flex justify-between gap-3 py-2 text-sm text-gray-600">
                  <span>Product subtotal</span>
                  <span className="text-right">
                    {formatPrice(getOrderSubtotal(selectedOrder))}
                  </span>
                </div>
                <div className="flex justify-between gap-3 py-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <FiTruck size={14} />
                    Shipping fee
                  </span>
                  <span className="text-right">
                    {formatPrice(getShippingPrice(selectedOrder))}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-3 border-t pt-4">
                  <span className="font-bold text-gray-900">Final total</span>
                  <span className="text-right text-lg font-bold text-indigo-600">
                    {formatPrice(getFinalTotal(selectedOrder))}
                  </span>
                </div>
              </section>

              <section>
                <label
                  htmlFor="modal-order-status"
                  className="mb-2 flex items-center gap-2 font-semibold text-gray-900"
                >
                  <FiEdit3 className="text-indigo-600" />
                  Update Order Status
                </label>

                <OrderStatusSelect
                  id="modal-order-status"
                  order={selectedOrder}
                  updatingId={updatingId}
                  onChange={handleStatusChange}
                />

                <p className="mt-2 text-xs text-gray-500">
                  Status changes are saved to the server.
                </p>
              </section>

              <p className="flex items-center gap-1.5 text-xs text-gray-400">
                <FiCalendar size={12} />
                Ordered on {formatDate(selectedOrder.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}