import React, { useCallback, useEffect, useMemo, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FiUsers,
  FiSearch,
  FiRefreshCw,
  FiMail,
  FiCalendar,
  FiShield,
  FiUser,
  FiX,
  FiAlertCircle,
  FiList,
  FiInfo,
} from "react-icons/fi";
import api from "../services/api";

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const Avatar = ({ name, admin, size = "h-10 w-10" }) => (
  <div
    className={`${size} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-md ${
      admin ? "from-purple-500 to-fuchsia-600" : "from-indigo-500 to-violet-600"
    }`}
  >
    {(name || "U").trim().charAt(0).toUpperCase()}
  </div>
);

const RoleBadge = ({ role }) => {
  const admin = role === "admin";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        admin
          ? "bg-purple-50 text-purple-700 ring-purple-200"
          : "bg-emerald-50 text-emerald-700 ring-emerald-200"
      }`}
    >
      {admin ? <FiShield size={13} /> : <FiUser size={13} />}
      {role || "customer"}
    </span>
  );
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    AOS.init({
      duration: 650,
      easing: "ease-out-cubic",
      once: true,
      offset: 30,
    });
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/users");
      const data = response.data;

      setUsers(data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load users. Please check your login and API connection."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        (user.name || "").toLowerCase().includes(keyword) ||
        (user.useremail || "").toLowerCase().includes(keyword);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const adminCount = users.filter((user) => user.role === "admin").length;
  const customerCount = users.filter((user) => user.role === "customer").length;

  const statCards = [
    {
      label: "Total Users",
      value: users.length,
      icon: FiUsers,
      gradient: "from-indigo-500 to-violet-600",
      glow: "bg-indigo-500/10",
    },
    {
      label: "Customers",
      value: customerCount,
      icon: FiUser,
      gradient: "from-emerald-500 to-teal-600",
      glow: "bg-emerald-500/10",
    },
    {
      label: "Administrators",
      value: adminCount,
      icon: FiShield,
      gradient: "from-purple-500 to-fuchsia-600",
      glow: "bg-purple-500/10",
    },
  ];

  const roleTabs = [
    { value: "all", label: "All Roles", icon: FiList, count: users.length },
    {
      value: "customer",
      label: "Customers",
      icon: FiUser,
      count: customerCount,
    },
    {
      value: "admin",
      label: "Administrators",
      icon: FiShield,
      count: adminCount,
    },
  ];

  // Re-scan AOS whenever the visible list changes
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => AOS.refreshHard(), 100);
      return () => clearTimeout(t);
    }
  }, [loading, filteredUsers]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6 lg:p-8">
      <style>{`
        @keyframes usrFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .usr-float { animation: usrFloat 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .usr-float { animation: none; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div
          data-aos="fade-down"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 text-white shadow-xl shadow-indigo-900/20 sm:p-8"
        >
          <div className="usr-float pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-fuchsia-300/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p
                data-aos="fade-right"
                data-aos-delay="100"
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur"
              >
                <FiUsers size={13} />
                Community
              </p>

              <h1
                data-aos="fade-right"
                data-aos-delay="200"
                className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl"
              >
                User Management
              </h1>

              <p
                data-aos="fade-right"
                data-aos-delay="300"
                className="mt-2 max-w-xl text-sm leading-6 text-indigo-50/90"
              >
                View and manage registered users.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              data-aos="fade-left"
              data-aos-delay="300"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw
                className={
                  loading
                    ? "animate-spin"
                    : "transition-transform duration-500 group-hover:rotate-180"
                }
              />
              Refresh Users
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <section
          aria-label="User statistics"
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {statCards.map(({ label, value, icon: Icon, gradient, glow }, index) => (
            <article
              key={label}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full transition-transform duration-500 group-hover:scale-150 ${glow}`}
              />

              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  {loading ? (
                    <div className="mt-3 h-8 w-14 animate-pulse rounded-lg bg-gray-100" />
                  ) : (
                    <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
                      {value.toLocaleString("en-IN")}
                    </h2>
                  )}
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${gradient}`}
                >
                  <Icon size={22} />
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Search and filter */}
        <div
          data-aos="fade-up"
          className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="relative">
            <FiSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              aria-label="Search users"
              className="w-full rounded-full border border-gray-200 py-3 pl-11 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:rotate-90 hover:text-gray-700"
              >
                <FiX size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {roleTabs.map(({ value, label, icon: Icon, count }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRoleFilter(value)}
                aria-pressed={roleFilter === value}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition duration-300 active:scale-95 sm:text-sm ${
                  roleFilter === value
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-300/50"
                    : "border border-gray-200 bg-white text-gray-600 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700"
                }`}
              >
                <Icon size={13} />
                {label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    roleFilter === value
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Users list */}
        <div
          data-aos="fade-up"
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                <FiUsers size={17} />
              </span>
              Registered Users
            </h2>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {filteredUsers.length} users
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : error ? (
            <div data-aos="zoom-in" className="px-5 py-14 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                <FiAlertCircle size={28} />
              </span>
              <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
              <button
                type="button"
                onClick={fetchUsers}
                className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
              >
                <FiRefreshCw
                  size={14}
                  className="transition-transform duration-500 group-hover:rotate-180"
                />
                Try Again
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div data-aos="zoom-in" className="px-5 py-16 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <FiUsers size={28} />
              </span>
              <h3 className="mt-4 font-semibold text-gray-800">
                No users found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or role filter.
              </p>
              {(search || roleFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("all");
                  }}
                  className="mt-5 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 active:scale-95"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="divide-y divide-gray-100 md:hidden">
                {filteredUsers.map((user, index) => (
                  <li
                    key={user._id}
                    data-aos="fade-up"
                    data-aos-delay={Math.min(index, 5) * 60}
                    className="space-y-3 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          name={user.name}
                          admin={user.role === "admin"}
                          size="h-11 w-11"
                        />
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-gray-900">
                            {user.name || "Unnamed User"}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 break-all text-xs text-gray-500">
                            <FiMail size={12} className="shrink-0" />
                            {user.useremail}
                          </p>
                        </div>
                      </div>
                      <RoleBadge role={user.role} />
                    </div>

                    <p className="flex items-center gap-1.5 text-xs text-gray-400">
                      <FiCalendar size={12} />
                      Joined {formatDate(user.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <FiUser size={13} /> User
                        </span>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <FiMail size={13} /> Email
                        </span>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <FiShield size={13} /> Role
                        </span>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <FiCalendar size={13} /> Joined Date
                        </span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user._id}
                        data-aos="fade"
                        data-aos-delay={Math.min(index, 8) * 40}
                        className="transition hover:bg-indigo-50/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={user.name}
                              admin={user.role === "admin"}
                            />
                            <p className="font-medium text-gray-900">
                              {user.name || "Unnamed User"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiMail className="shrink-0 text-gray-400" />
                            {user.useremail}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <RoleBadge role={user.role} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiCalendar className="text-gray-400" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <p
          data-aos="fade-up"
          className="flex items-start gap-2 rounded-xl bg-white/70 p-3 text-xs leading-5 text-gray-500"
        >
          <FiInfo size={14} className="mt-0.5 shrink-0 text-indigo-500" />
          User passwords are not displayed. This page currently provides
          read-only user information.
        </p>
      </div>
    </div>
  );
};

export default Users;