import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FiTruck,
  FiSave,
  FiRotateCcw,
  FiInfo,
  FiCheckCircle,
  FiEdit3,
  FiShoppingBag,
  FiGift,
  FiZap,
  FiSettings,
  FiRefreshCw,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

const PRESETS = [0, 40, 60, 99, 149];

const SAMPLE_SUBTOTAL = 1000;

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export default function ShippingAmount() {
  const [shippingAmount, setShippingAmount] = useState("0");
  const [savedAmount, setSavedAmount] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 650,
      easing: "ease-out-cubic",
      once: true,
      offset: 30,
    });
  }, []);

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

        const value = String(data.shippingAmount ?? 0);
        setShippingAmount(value);
        setSavedAmount(value);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to load shipping amount"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchShippingAmount();
  }, []);

  // Re-scan AOS once the real content replaces the loading skeleton
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => AOS.refreshHard(), 100);
      return () => clearTimeout(t);
    }
  }, [loading]);

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

      const value = String(data.shippingAmount);
      setShippingAmount(value);
      setSavedAmount(value);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
      toast.success("Shipping amount saved successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save shipping amount"
      );
    } finally {
      setSaving(false);
    }
  };

  const currentNumber = Number(shippingAmount);
  const validAmount =
    shippingAmount.trim() !== "" &&
    Number.isFinite(currentNumber) &&
    currentNumber >= 0;
  const dirty = shippingAmount !== savedAmount;
  const previewShipping = validAmount ? currentNumber : 0;

  /* ---------- Loading skeleton ---------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-6 p-4">
        <div className="h-40 rounded-3xl bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="h-80 rounded-2xl bg-slate-200 lg:col-span-3" />
          <div className="h-80 rounded-2xl bg-slate-200 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl overflow-x-hidden">
      <style>{`
        @keyframes shipFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shipDrive {
          0% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          100% { transform: translateX(-4px); }
        }
        @keyframes shipPop {
          0% { transform: scale(0.9); opacity: 0; }
          60% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); }
        }
        .ship-float { animation: shipFloat 4s ease-in-out infinite; }
        .ship-drive { animation: shipDrive 2.4s ease-in-out infinite; }
        .ship-pop { animation: shipPop 0.35s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .ship-float, .ship-drive, .ship-pop { animation: none; }
        }
      `}</style>

      {/* Header */}
      <div
        data-aos="fade-down"
        className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl shadow-indigo-900/20 sm:p-8"
      >
        <div className="ship-float pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-fuchsia-300/20 blur-3xl" />

        <div className="relative flex items-center justify-between gap-5">
          <div className="min-w-0">
            <p
              data-aos="fade-right"
              data-aos-delay="100"
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur"
            >
              <FiSettings size={13} />
              Store Settings
            </p>

            <h1
              data-aos="fade-right"
              data-aos-delay="200"
              className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl"
            >
              Shipping Amount
            </h1>

            <p
              data-aos="fade-right"
              data-aos-delay="300"
              className="mt-2 max-w-xl text-sm leading-6 text-indigo-50/90"
            >
              Manage the delivery fee charged to customers.
            </p>
          </div>

          <div
            data-aos="zoom-in"
            data-aos-delay="300"
            className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/10 backdrop-blur sm:flex"
          >
            <FiTruck size={36} className="ship-drive" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form card */}
        <div
          data-aos="fade-up"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-3"
        >
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
              <FiTruck size={26} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-800">
                Standard Shipping Fee
              </h2>
              <p className="text-sm text-slate-500">
                Amount in Indian Rupees (INR)
              </p>
            </div>

            {dirty ? (
              <span className="ship-pop ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                <FiEdit3 size={12} />
                Unsaved
              </span>
            ) : (
              <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <FiCheckCircle size={12} />
                Saved
              </span>
            )}
          </div>

          <form onSubmit={handleSave}>
            <label
              htmlFor="shippingAmount"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Shipping amount (₹)
            </label>

            <div className="flex items-center rounded-xl border border-slate-300 bg-white transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100">
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
                className="w-full rounded-r-xl border-0 bg-transparent px-3 py-4 text-lg font-semibold text-slate-800 outline-none"
                placeholder="Enter shipping fee"
              />
            </div>

            {/* Quick presets */}
            <div className="mt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <FiZap size={12} />
                Quick amounts
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => {
                  const active = validAmount && currentNumber === preset;

                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setShippingAmount(String(preset))}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition duration-300 active:scale-95 sm:text-sm ${
                        active
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-300/50"
                          : "border border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700"
                      }`}
                    >
                      {preset === 0 && <FiGift size={13} />}
                      {preset === 0 ? "Free" : `₹${preset}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
              <FiInfo size={14} className="mt-0.5 shrink-0 text-indigo-500" />
              The customer-facing Cart and Checkout must fetch this saved
              value from the server.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setShippingAmount(savedAmount)}
                disabled={!dirty || saving}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                <FiRotateCcw
                  size={16}
                  className="transition-transform duration-500 group-hover:-rotate-180"
                />
                Reset
              </button>

              <button
                type="submit"
                disabled={saving || !dirty}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto ${
                  justSaved
                    ? "bg-emerald-600 shadow-emerald-300/40"
                    : "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-300/40"
                }`}
              >
                {saving ? (
                  <FiRefreshCw size={18} className="animate-spin" />
                ) : justSaved ? (
                  <FiCheckCircle size={18} />
                ) : (
                  <FiSave size={18} />
                )}
                {saving
                  ? "Saving..."
                  : justSaved
                    ? "Saved!"
                    : "Save Shipping Amount"}
              </button>
            </div>
          </form>
        </div>

        {/* Live checkout preview */}
        <aside
          data-aos="fade-left"
          data-aos-delay="150"
          className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"
        >
          <h2 className="flex items-center gap-2 font-bold text-slate-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FiShoppingBag size={17} />
            </span>
            Checkout preview
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            How customers will see the fee, using a sample {formatPrice(SAMPLE_SUBTOTAL)} order.
          </p>

          <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-3 text-slate-600">
              <span>Subtotal</span>
              <span>{formatPrice(SAMPLE_SUBTOTAL)}</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-slate-600">
              <span className="flex items-center gap-1.5">
                <FiTruck size={14} />
                Shipping
              </span>
              <span
                key={previewShipping}
                className={`ship-pop font-semibold ${
                  previewShipping === 0 ? "text-emerald-600" : "text-slate-800"
                }`}
              >
                {previewShipping === 0 ? "Free" : formatPrice(previewShipping)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
              <span className="font-bold text-slate-900">Total</span>
              <span
                key={SAMPLE_SUBTOTAL + previewShipping}
                className="ship-pop text-lg font-bold text-indigo-600"
              >
                {formatPrice(SAMPLE_SUBTOTAL + previewShipping)}
              </span>
            </div>
          </div>

          {!validAmount && (
            <p className="mt-3 text-xs text-amber-600">
              Enter a valid amount to see the preview.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}