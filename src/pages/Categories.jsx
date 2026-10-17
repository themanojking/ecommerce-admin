import React, { useCallback, useEffect, useMemo, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiX,
  FiLayers,
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiXCircle,
  FiCalendar,
  FiFileText,
  FiTag,
  FiSave,
  FiPower,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";

const emptyForm = {
  name: "",
  description: "",
  isActive: true,
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    AOS.init({
      duration: 650,
      easing: "ease-out-cubic",
      once: true,
      offset: 30,
    });
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/categories");
      setCategories(response.data.categories || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return categories.filter(
      (category) =>
        (category.name || "").toLowerCase().includes(keyword) ||
        (category.description || "").toLowerCase().includes(keyword)
    );
  }, [categories, search]);

  const activeCount = categories.filter((category) => category.isActive).length;
  const inactiveCount = categories.length - activeCount;

  const statCards = [
    {
      label: "Total Categories",
      value: categories.length,
      icon: FiLayers,
      gradient: "from-indigo-500 to-violet-600",
      glow: "bg-indigo-500/10",
    },
    {
      label: "Active Categories",
      value: activeCount,
      icon: FiCheckCircle,
      gradient: "from-emerald-500 to-teal-600",
      glow: "bg-emerald-500/10",
    },
    {
      label: "Inactive Categories",
      value: inactiveCount,
      icon: FiAlertCircle,
      gradient: "from-amber-400 to-orange-500",
      glow: "bg-amber-500/10",
    },
  ];

  // Re-scan AOS whenever the visible list changes
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => AOS.refreshHard(), 100);
      return () => clearTimeout(t);
    }
  }, [loading, filteredCategories]);

  // Escape closes any open popup and the page does not scroll behind it
  useEffect(() => {
    if (!formOpen && !deleteTarget) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (deleteTarget) setDeleteTarget(null);
      else if (!saving) closeForm();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen, deleteTarget, saving]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (category) => {
    setEditingId(category._id);
    setForm({
      name: category.name || "",
      description: category.description || "",
      isActive: category.isActive !== false,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, {
          name: form.name.trim(),
          description: form.description.trim(),
          isActive: form.isActive,
        });

        toast.success("Category updated successfully");
      } else {
        await api.post("/admin/categories", {
          name: form.name.trim(),
          description: form.description.trim(),
        });

        toast.success("Category created successfully");
      }

      closeForm();
      await fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await api.delete(`/admin/categories/${deleteTarget._id}`);
      toast.success("Category deleted successfully");
      setDeleteTarget(null);
      await fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (category) => {
    try {
      await api.put(`/admin/categories/${category._id}`, {
        isActive: !category.isActive,
      });

      toast.success(
        category.isActive ? "Category deactivated" : "Category activated"
      );

      await fetchCategories();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update category status"
      );
    }
  };

  const StatusButton = ({ category }) => (
    <button
      type="button"
      onClick={() => toggleStatus(category)}
      title="Click to change status"
      className={`group inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition active:scale-95 ${
        category.isActive
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
          : "bg-gray-100 text-gray-600 ring-gray-200 hover:bg-gray-200"
      }`}
    >
      {category.isActive ? (
        <FiCheckCircle size={12} />
      ) : (
        <FiXCircle size={12} />
      )}
      {category.isActive ? "Active" : "Inactive"}
      <FiPower
        size={11}
        className="opacity-0 transition-opacity group-hover:opacity-70"
      />
    </button>
  );

  const ActionButtons = ({ category }) => (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => openEditForm(category)}
        title="Edit category"
        aria-label="Edit category"
        className="group rounded-lg border border-blue-100 p-2.5 text-blue-600 transition hover:bg-blue-600 hover:text-white active:scale-90"
      >
        <FiEdit2
          size={16}
          className="transition-transform group-hover:rotate-12"
        />
      </button>

      <button
        type="button"
        onClick={() => setDeleteTarget(category)}
        title="Delete category"
        aria-label="Delete category"
        className="group rounded-lg border border-red-100 p-2.5 text-red-600 transition hover:bg-red-600 hover:text-white active:scale-90"
      >
        <FiTrash2
          size={16}
          className="transition-transform group-hover:-rotate-12"
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6 lg:p-8">
      <style>{`
        @keyframes catModalIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes catFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes catFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes catShake {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        .cat-modal-in { animation: catModalIn 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
        .cat-fade { animation: catFade 0.25s ease-out; }
        .cat-float { animation: catFloat 4s ease-in-out infinite; }
        .cat-shake { animation: catShake 0.6s ease-in-out 0.3s; }
        @media (prefers-reduced-motion: reduce) {
          .cat-modal-in, .cat-fade, .cat-float, .cat-shake { animation: none; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div
          data-aos="fade-down"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-xl shadow-indigo-900/20 sm:p-8"
        >
          <div className="cat-float pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-pink-300/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p
                data-aos="fade-right"
                data-aos-delay="100"
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur"
              >
                <FiLayers size={13} />
                Catalogue
              </p>

              <h1
                data-aos="fade-right"
                data-aos-delay="200"
                className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl"
              >
                Category Management
              </h1>

              <p
                data-aos="fade-right"
                data-aos-delay="300"
                className="mt-2 max-w-xl text-sm leading-6 text-indigo-50/90"
              >
                Organize your products into categories.
              </p>
            </div>

            <div
              data-aos="fade-left"
              data-aos-delay="300"
              className="flex flex-wrap gap-2"
            >
              <button
                type="button"
                onClick={fetchCategories}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                Refresh
              </button>

              <button
                type="button"
                onClick={openCreateForm}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-xl active:scale-95"
              >
                <FiPlus
                  size={18}
                  className="transition-transform duration-300 group-hover:rotate-90"
                />
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <section
          aria-label="Category statistics"
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
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
                      {value.toLocaleString("en-IN")}
                    </p>
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

        {/* Search */}
        <div
          data-aos="fade-up"
          className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <FiSearch
            className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search category name or description..."
            aria-label="Search categories"
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-7 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:rotate-90 hover:text-gray-700"
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        {/* Category list */}
        <div
          data-aos="fade-up"
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                <FiLayers size={17} />
              </span>
              All Categories
            </h2>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {filteredCategories.length} categories
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
          ) : filteredCategories.length === 0 ? (
            <div data-aos="zoom-in" className="px-5 py-16 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <FiLayers size={28} />
              </span>
              <h3 className="mt-4 font-semibold text-gray-800">
                No categories found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Add a category or try a different search.
              </p>
              {!search && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
                >
                  <FiPlus />
                  Add Category
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="divide-y divide-gray-100 md:hidden">
                {filteredCategories.map((category, index) => (
                  <li
                    key={category._id}
                    data-aos="fade-up"
                    data-aos-delay={Math.min(index, 5) * 60}
                    className="space-y-3 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <FiLayers size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold text-gray-900">
                          {category.name}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                          {category.description || "No description"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <StatusButton category={category} />
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <FiCalendar size={12} />
                          {formatDate(category.createdAt)}
                        </span>
                      </div>
                      <ActionButtons category={category} />
                    </div>
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
                          <FiTag size={13} /> Category
                        </span>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <FiFileText size={13} /> Description
                        </span>
                      </th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <FiCalendar size={13} /> Created
                        </span>
                      </th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredCategories.map((category, index) => (
                      <tr
                        key={category._id}
                        data-aos="fade"
                        data-aos-delay={Math.min(index, 8) * 40}
                        className="transition hover:bg-indigo-50/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                              <FiLayers size={19} />
                            </div>
                            <span className="font-semibold text-gray-900">
                              {category.name}
                            </span>
                          </div>
                        </td>

                        <td className="max-w-xs px-5 py-4 text-sm text-gray-500">
                          <span className="line-clamp-2">
                            {category.description || "No description"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusButton category={category} />
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {formatDate(category.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <ActionButtons category={category} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create / Edit modal */}
      {formOpen && (
        <div
          className="cat-fade fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) closeForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            className="cat-modal-in my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                  {editingId ? <FiEdit2 size={19} /> : <FiPlus size={21} />}
                </span>
                <div>
                  <h2
                    id="category-modal-title"
                    className="text-lg font-bold text-gray-900"
                  >
                    {editingId ? "Edit Category" : "Add Category"}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Enter the category details below.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close category form"
                className="rounded-lg p-2 text-gray-500 transition hover:rotate-90 hover:bg-gray-100 hover:text-gray-900"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category Name *
                </label>
                <div className="relative">
                  <FiTag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="e.g. Electronics"
                    className={inputClass}
                  />
                </div>
                <p className="mt-1.5 text-right text-xs text-gray-400">
                  {form.name.length}/100
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-3.5 top-4 text-gray-400" />
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="Describe this category..."
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <p className="mt-1.5 text-right text-xs text-gray-400">
                  {form.description.length}/500
                </p>
              </div>

              {editingId && (
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:bg-gray-100">
                  <span className="flex items-center gap-2">
                    {form.isActive ? (
                      <FiCheckCircle className="text-emerald-500" />
                    ) : (
                      <FiXCircle className="text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      Category is {form.isActive ? "active" : "inactive"}
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm({ ...form, isActive: event.target.checked })
                    }
                    className="peer sr-only"
                  />
                  <span className="relative h-6 w-11 shrink-0 rounded-full bg-gray-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-indigo-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-100" />
                </label>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-300/40 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <FiRefreshCw className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingId ? <FiSave /> : <FiPlus />}
                      {editingId ? "Save Changes" : "Create Category"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="cat-fade fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
            className="cat-modal-in w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="cat-shake mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/60">
              <FiTrash2 size={24} />
            </div>

            <h2
              id="delete-category-title"
              className="text-lg font-bold text-gray-900"
            >
              Delete category?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to delete{" "}
              <strong className="text-gray-800">{deleteTarget.name}</strong>?
              This action cannot be undone.
            </p>

            <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-700">
              <FiAlertTriangle size={14} className="mt-0.5 shrink-0" />
              Check that no products depend on this category before deleting
              it.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-300/40 transition hover:bg-red-700 active:scale-95 disabled:opacity-50"
              >
                {deleting ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiTrash2 />
                )}
                {deleting ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;