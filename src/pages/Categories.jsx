
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";

const emptyForm = {
  name: "",
  description: "",
  isActive: true,
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/categories");
      setCategories(response.data.categories || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load categories"
      );
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

  const activeCount = categories.filter(
    (category) => category.isActive
  ).length;

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
      toast.error(
        error.response?.data?.message || "Failed to save category"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await api.delete(`/admin/categories/${deleteTarget._id}`);
      toast.success("Category deleted successfully");
      setDeleteTarget(null);
      await fetchCategories();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete category"
      );
    }
  };

  const toggleStatus = async (category) => {
    try {
      await api.put(`/admin/categories/${category._id}`, {
        isActive: !category.isActive,
      });

      toast.success(
        category.isActive
          ? "Category deactivated"
          : "Category activated"
      );

      await fetchCategories();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update category status"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Category Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Organize your products into categories.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
            >
              <FiPlus size={18} />
              Add Category
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Categories</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {categories.length}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <FiLayers size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Categories</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {activeCount}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <FiCheckCircle size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive Categories</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {categories.length - activeCount}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <FiAlertCircle size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <FiSearch
            className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search category name or description..."
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
          />
        </div>

        {/* Category table */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              All Categories
            </h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {filteredCategories.length} categories
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <FiLayers className="mx-auto mb-3 text-gray-300" size={36} />
              <h3 className="font-semibold text-gray-800">
                No categories found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Add a category or try a different search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Category</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Created</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredCategories.map((category) => (
                    <tr key={category._id} className="hover:bg-gray-50">
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
                        <button
                          onClick={() => toggleStatus(category)}
                          title="Click to change status"
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            category.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500">
                        {category.createdAt
                          ? new Date(category.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditForm(category)}
                            title="Edit category"
                            className="rounded-lg border border-gray-200 p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <FiEdit2 size={16} />
                          </button>

                          <button
                            onClick={() => setDeleteTarget(category)}
                            title="Delete category"
                            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId ? "Edit Category" : "Add Category"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the category details below.
                </p>
              </div>

              <button
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Electronics"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Describe this category..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                />
              </div>

              {editingId && (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        isActive: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-gray-900"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Category is active
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <FiTrash2 size={22} />
            </div>

            <h2 className="text-lg font-bold text-gray-900">
              Delete category?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to delete{" "}
              <strong className="text-gray-800">
                {deleteTarget.name}
              </strong>
              ? This action cannot be undone.
            </p>

            <p className="mt-2 text-xs text-amber-700">
              Check that no products depend on this category before deleting it.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
