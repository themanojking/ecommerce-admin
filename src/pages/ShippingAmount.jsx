import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiTruck, FiSave } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

export default function ShippingAmount() {
  const [shippingAmount, setShippingAmount] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
    },
  });

  useEffect(() => {
    const fetchShippingAmount = async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/admin/shipping`,
          getConfig()
        );

        setShippingAmount(String(data.shippingAmount ?? 0));
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Failed to load shipping amount"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchShippingAmount();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    const amount = Number(shippingAmount);

    if (
      shippingAmount.trim() === "" ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      toast.error("Enter a valid shipping amount");
      return;
    }

    try {
      setSaving(true);

      const { data } = await axios.put(
        `${API_URL}/admin/shipping`,
        { shippingAmount: amount },
        getConfig()
      );

      setShippingAmount(String(data.shippingAmount));
      toast.success("Shipping amount saved successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to save shipping amount"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading shipping settings...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          Store Settings
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">
          Shipping Amount
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage the delivery fee charged to customers.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FiTruck size={26} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">
              Standard Shipping Fee
            </h2>
            <p className="text-sm text-slate-500">
              Amount in Indian Rupees (INR)
            </p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <label
            htmlFor="shippingAmount"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Shipping amount (₹)
          </label>

          <div className="flex items-center rounded-xl border border-slate-300 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100">
            <span className="px-4 text-lg font-semibold text-slate-500">
              ₹
            </span>
            <input
              id="shippingAmount"
              type="number"
              min="0"
              step="0.01"
              required
              value={shippingAmount}
              onChange={(e) => setShippingAmount(e.target.value)}
              className="w-full rounded-r-xl border-0 bg-transparent px-3 py-4 outline-none"
              placeholder="Enter shipping fee"
            />
          </div>

          <p className="mt-2 text-xs text-slate-500">
            The customer-facing Cart and Checkout must fetch this saved
            value from the server.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <FiSave size={18} />
            {saving ? "Saving..." : "Save Shipping Amount"}
          </button>
        </form>
      </div>
    </div>
  );
}
