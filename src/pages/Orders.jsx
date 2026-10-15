
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiRefreshCw,
  FiEye,
  FiX,
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
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
};

const getShippingPrice = (order) => {
  if (order.shippingPrice != null) {
    return Number(order.shippingPrice) || 0;
  }

  return Math.max(
    0,
    (Number(order.totalPrice) || 0) - getOrderSubtotal(order)
  );
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

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-semibold ${
      statusColors[status] || "bg-gray-100 text-gray-700"
    }`}
  >
    {status || "Pending"}
  </span>
);

const OrderStatusSelect = ({ order, updatingId, onChange, id }) => (
  <select
    id={id}
    value={order.status || "Pending"}
    disabled={updatingId === order._id}
    onChange={(event) => onChange(order._id, event.target.value)}
    className={`w-full min-w-0 rounded-lg border-0 px-2 py-2 text-xs font-semibold outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 sm:w-auto ${
      statusColors[order.status] || "bg-gray-100 text-gray-700"
    }`}
  >
    {ORDER_STATUSES.map((status) => (
      <option key={status} value={status}>
        {status}
      </option>
    ))}
  </select>
);

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState("All");

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/admin/orders");
      const fetchedOrders = data.orders || [];

      setOrders(fetchedOrders);

      setSelectedOrder((current) =>
        current
          ? fetchedOrders.find((order) => order._id === current._id) ||
            current
          : null
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch orders"
      );
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

      const { data } = await api.put(
        `/admin/orders/${orderId}/status`,
        { status }
      );

      const updatedOrder = data.order;

      setOrders((previous) =>
        previous.map((order) =>
          order._id === orderId
            ? { ...order, ...updatedOrder }
            : order
        )
      );

      setSelectedOrder((previous) =>
        previous?._id === orderId
          ? { ...previous, ...updatedOrder }
          : previous
      );

      toast.success("Order status updated successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders =
    filter === "All"
      ? orders
      : orders.filter((order) => order.status === filter);

  const summary = [
    { label: "Total Orders", value: orders.length },
    {
      label: "Pending",
      value: orders.filter((o) => o.status === "Pending").length,
    },
    {
      label: "Processing",
      value: orders.filter((o) => o.status === "Processing").length,
    },
    {
      label: "Delivered",
      value: orders.filter((o) => o.status === "Delivered").length,
    },
  ];

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-gray-50 p-3 sm:p-5 lg:p-6 xl:p-8">
      <div className="mx-auto w-full max-w-[1600px] min-w-0">
        {/* Header */}
        <header className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 sm:gap-3 sm:text-2xl xl:text-3xl">
              <FiPackage className="shrink-0 text-indigo-600" />
              <span>Order Management</span>
            </h1>
            <p className="mt-1.5 text-xs text-gray-500 sm:text-sm">
              View customer orders and manage their status.
            </p>
          </div>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh Orders
          </button>
        </header>

        {/* Summary cards */}
        <section className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4 lg:p-5"
            >
              <p className="break-words text-xs text-gray-500 sm:text-sm">
                {item.label}
              </p>
              <p className="mt-1.5 text-xl font-bold text-gray-900 sm:mt-2 sm:text-2xl lg:text-3xl">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        {/* Filters */}
        <section className="mb-4 min-w-0">
          <div className="flex flex-wrap gap-2">
            {["All", ...ORDER_STATUSES].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-full px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                  filter === status
                    ? "bg-indigo-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </section>

        {/* Orders */}
        <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-56 items-center justify-center sm:h-72">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="px-4 py-14 text-center sm:py-16">
              <FiPackage className="mx-auto text-4xl text-gray-300" />
              <h3 className="mt-3 font-semibold text-gray-800">
                No orders found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Orders matching this filter will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile and tablet cards */}
              <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 md:p-4 lg:hidden">
                {filteredOrders.map((order) => (
                  <article
                    key={order._id}
                    className="min-w-0 rounded-xl border border-gray-200 p-3.5 sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all text-sm font-bold text-gray-900">
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="mt-1 break-words font-medium text-gray-800">
                          {order.shippingAddress?.name ||
                            order.user?.name ||
                            "Customer"}
                        </p>
                        <p className="break-all text-xs text-gray-500">
                          {order.shippingAddress?.useremail ||
                            order.user?.useremail ||
                            "-"}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">
                          Products & Quantity
                        </p>
                        <div className="mt-1 space-y-2">
                          {(order.orderItems || []).map((item, index) => (
                            <div
                              key={item._id || `${order._id}-${index}`}
                              className="flex min-w-0 items-start justify-between gap-3"
                            >
                              <p className="min-w-0 break-words text-gray-800">
                                {getProductName(item)}
                              </p>
                              <span className="shrink-0 text-xs text-gray-500">
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
                          <p className="mt-1 break-words text-sm text-gray-800">
                            {order.paymentMethod || "COD"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] items-end gap-2 border-t border-gray-100 pt-3">
                        <div className="min-w-0">
                          <label className="mb-1.5 block text-xs text-gray-500">
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
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 sm:text-sm"
                        >
                          <FiEye />
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

                  <thead className="bg-gray-100 text-[10px] uppercase text-gray-600 xl:text-xs">
                    <tr>
                      {[
                        "Order",
                        "Customer",
                        "Date",
                        "Products & Qty",
                        "Payment",
                        "Total",
                        "Status",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-2 py-3 font-semibold xl:px-3 xl:py-4"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="break-words px-2 py-3 font-semibold text-gray-800 xl:px-3">
                          #{order._id.slice(-8).toUpperCase()}
                        </td>

                        <td className="min-w-0 px-2 py-3 xl:px-3">
                          <p className="break-words font-medium text-gray-800">
                            {order.shippingAddress?.name ||
                              order.user?.name ||
                              "Customer"}
                          </p>
                          <p className="mt-1 break-all text-[10px] text-gray-500 xl:text-xs">
                            {order.shippingAddress?.useremail ||
                              order.user?.useremail ||
                              "-"}
                          </p>
                        </td>

                        <td className="break-words px-2 py-3 text-gray-600 xl:px-3">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="min-w-0 px-2 py-3 xl:px-3">
                          <div className="space-y-2">
                            {(order.orderItems || []).map((item, index) => (
                              <div
                                key={item._id || `${order._id}-${index}`}
                                className="min-w-0"
                              >
                                <p className="break-words font-medium text-gray-800">
                                  {getProductName(item)}
                                </p>
                                <p className="text-[10px] text-gray-500 xl:text-xs">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                            ))}
                            {!order.orderItems?.length && (
                              <span className="text-gray-400">
                                No product details
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="break-words px-2 py-3 text-gray-600 xl:px-3">
                          {order.paymentMethod || "COD"}
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
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-2 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 xl:gap-1.5 xl:px-3"
                          >
                            <FiEye />
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
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="my-auto max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                  Order Details
                </h2>
                <p className="mt-1 break-all text-xs text-gray-500 sm:text-sm">
                  #{selectedOrder._id}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close order details"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-5 p-4 sm:space-y-6 sm:p-5">
              <section>
                <h3 className="mb-3 font-semibold text-gray-900">
                  Shipping Address
                </h3>

                <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                  <p className="break-words font-semibold text-gray-900">
                    {selectedOrder.shippingAddress?.name ||
                      selectedOrder.user?.name ||
                      "Customer"}
                  </p>
                  <p className="break-all">
                    {selectedOrder.shippingAddress?.useremail ||
                      selectedOrder.user?.useremail ||
                      ""}
                  </p>
                  <p>{selectedOrder.shippingAddress?.phone}</p>
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
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-gray-900">
                  Ordered Products
                </h3>

                <div className="space-y-3">
                  {selectedOrder.orderItems?.map((item, index) => (
                    <div
                      key={item._id || `${selectedOrder._id}-${index}`}
                      className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-gray-100 p-3"
                    >
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

                      <p className="shrink-0 text-sm font-semibold text-gray-900">
                        {formatPrice(
                          Number(item.price || 0) *
                            Number(item.quantity || 0)
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl bg-gray-50 p-4">
                <div className="flex justify-between gap-3 py-2 text-sm text-gray-600">
                  <span>Payment method</span>
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
                  <span>Shipping fee</span>
                  <span className="text-right">
                    {formatPrice(getShippingPrice(selectedOrder))}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-3 border-t pt-4">
                  <span className="font-bold text-gray-900">
                    Final total
                  </span>
                  <span className="text-right text-lg font-bold text-indigo-600">
                    {formatPrice(getFinalTotal(selectedOrder))}
                  </span>
                </div>
              </section>

              <section>
                <label
                  htmlFor="modal-order-status"
                  className="mb-2 block font-semibold text-gray-900"
                >
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

              <p className="text-xs text-gray-400">
                Ordered on {formatDate(selectedOrder.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
