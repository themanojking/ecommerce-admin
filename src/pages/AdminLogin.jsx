
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import toast from "react-hot-toast";
import AOS from "aos";
import "aos/dist/aos.css";

import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
  FiShoppingBag,
  FiPackage,
  FiUsers,
  FiBarChart2,
} from "react-icons/fi";

import api from "../services/api";

const CLIENT_URL =
  import.meta.env.VITE_CLIENT_URL || "https://ecommerce-client-sports.vercel.app";

const features = [
  {
    icon: FiPackage,
    title: "Products & stock",
    text: "Add items, update prices and track inventory.",
  },
  {
    icon: FiShoppingBag,
    title: "Orders",
    text: "Review new orders and update their status.",
  },
  {
    icon: FiUsers,
    title: "Customers",
    text: "See who is buying and manage their accounts.",
  },
  {
    icon: FiBarChart2,
    title: "Sales reports",
    text: "Follow revenue and best sellers over time.",
  },
];

const AdminLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    useremail: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 20,
      disable: () =>
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }, []);

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { data } = await api.post("/auth/login", {
        useremail: formData.useremail.trim().toLowerCase(),
        password: formData.password,
      });

      if (!data.token || !data.user) {
        toast.error("Invalid login response.");
        return;
      }

      // Only admin accounts are allowed.
      if (data.user.role !== "admin") {
        toast.error("Access denied. Admin account required.");
        return;
      }

      // Save admin credentials.
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));

      toast.success("Admin login successful!");

      navigate("/", { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  // Navigate to the public Client website.
  const handleBackToWebsite = () => {
    window.location.href = CLIENT_URL.replace(/\/+$/, "");
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left brand panel */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-20">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 animate-pulse rounded-full bg-purple-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 animate-pulse rounded-full bg-indigo-400/20 blur-3xl" />

        <div
          data-aos="fade-down"
          className="relative flex items-center gap-3 text-white"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <FiShield size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Store Admin
          </span>
        </div>

        <div className="relative">
          <h2
            data-aos="fade-right"
            data-aos-delay="100"
            className="max-w-md text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl"
          >
            Run your store from one place.
          </h2>

          <p
            data-aos="fade-right"
            data-aos-delay="200"
            className="mt-4 max-w-md text-base text-indigo-100/80"
          >
            Manage products, orders and customers with a single sign-in.
          </p>

          <ul className="mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, text }, index) => (
              <li
                key={title}
                data-aos="fade-up"
                data-aos-delay={300 + index * 100}
                className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Icon size={20} />
                </div>

                <h3 className="text-sm font-semibold text-white">
                  {title}
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-indigo-100/75">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <p
          data-aos="fade-up"
          data-aos-delay="700"
          className="relative text-sm text-indigo-100/60"
        >
          Authorised staff only. Sign-ins are checked against admin accounts.
        </p>
      </aside>

      {/* Right login panel */}
      <main className="flex w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div
            data-aos="zoom-in"
            className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-indigo-100/50 sm:p-9"
          >
            <div
              data-aos="zoom-in"
              data-aos-delay="150"
              className="mb-6 flex justify-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <FiShield size={30} />
              </div>
            </div>

            <div
              data-aos="fade-up"
              data-aos-delay="200"
              className="mb-8 text-center"
            >
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Admin sign in
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Use your admin email and password to open the dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div data-aos="fade-up" data-aos-delay="300">
                <label
                  htmlFor="useremail"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <FiMail
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />

                  <input
                    id="useremail"
                    type="email"
                    name="useremail"
                    value={formData.useremail}
                    onChange={handleChange}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div data-aos="fade-up" data-aos-delay="400">
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>

                <div className="relative">
                  <FiLock
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className={`${inputClass} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-indigo-600 focus:outline-none focus-visible:text-indigo-600"
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div data-aos="fade-up" data-aos-delay="500">
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <FiArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Back to Client website */}
            <div
              data-aos="fade-up"
              data-aos-delay="600"
              className="mt-7 border-t border-gray-100 pt-6 text-center"
            >
              <button
                type="button"
                onClick={handleBackToWebsite}
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
              >
                <FiArrowLeft size={16} />
                Back to website
              </button>
            </div>
          </div>

          <p
            data-aos="fade-up"
            data-aos-delay="700"
            className="mt-5 text-center text-xs text-gray-400"
          >
            Only admin accounts can access the dashboard.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
