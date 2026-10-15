import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  FiPlus,
  FiX,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiPackage,
  FiSearch,
} from "react-icons/fi";
import toast from "react-hot-toast";

const initialForm = {
  productName: "",
  description: "",
  price: "",
  category: "",
  images: [""],
  stock: 0,
  isAvailable: true,
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);

  // Fetch products and categories
  const fetchData = async () => {
    try {
      setLoading(true);

      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/admin/products"),
        api.get("/admin/categories"),
      ]);

      const productData =
        productsRes.data?.products ??
        productsRes.data?.data ??
        productsRes.data;

      const categoryData =
        categoriesRes.data?.categories ??
        categoriesRes.data?.data ??
        categoriesRes.data;

      setProducts(Array.isArray(productData) ? productData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (error) {
      console.error("Fetch products error:", error);
      toast.error(
        error.response?.data?.message || "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open empty form for adding a product
  const openAddForm = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      images: [""],
    });
    setFormOpen(true);
  };

  // Close popup and reset form
  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm({
      ...initialForm,
      images: [""],
    });
  };

  // Update form fields
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Update image URL
  const handleImageChange = (index, value) => {
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = value;
      return { ...prev, images };
    });
  };

  // Add another image URL input
  const addImageField = () => {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ""],
    }));
  };

  // Remove image URL input
  const removeImageField = (index) => {
    setForm((prev) => ({
      ...prev,
      images:
        prev.images.length > 1
          ? prev.images.filter((_, i) => i !== index)
          : [""],
    }));
  };

  // Open popup with product data for editing
  const handleEdit = (product) => {
    setEditingId(product._id);

    setForm({
      productName: product.productName || product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      category:
        typeof product.category === "object"
          ? product.category?._id || product.category?.name || ""
          : product.category || "",
      images:
        Array.isArray(product.images) && product.images.length > 0
          ? product.images.map((image) =>
              typeof image === "string" ? image : image?.url || ""
            )
          : [""],
      stock: product.stock ?? 0,
      isAvailable: product.isAvailable ?? true,
    });

    setFormOpen(true);
  };

  // Create or update product
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.productName.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (form.price === "" || Number(form.price) < 0) {
      toast.error("Enter a valid product price");
      return;
    }

    if (Number(form.stock) < 0) {
      toast.error("Stock cannot be negative");
      return;
    }

    if (!form.category) {
      toast.error("Please select a category");
      return;
    }

    const payload = {
      ...form,
      productName: form.productName.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      images: form.images.map((image) => image.trim()).filter(Boolean),
    };

    try {
      setSaving(true);

      if (editingId) {
        await api.put(`/admin/products/${editingId}`, payload);
        toast.success("Product updated successfully");
      } else {
        await api.post("/admin/products", payload);
        toast.success("Product added successfully");
      }

      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Save product error:", error);
      toast.error(
        error.response?.data?.message || "Failed to save product"
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        product.productName || product.name || "this product"
      }"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/admin/products/${product._id}`);
      toast.success("Product deleted successfully");
      await fetchData();
    } catch (error) {
      console.error("Delete product error:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete product"
      );
    }
  };

  // Product category display
  const getCategoryName = (product) => {
    if (typeof product.category === "object") {
      return product.category?.name || product.category?.categoryName || "—";
    }

    const category = categories.find(
      (item) =>
        item._id === product.category || item.name === product.category
    );

    return category?.name || category?.categoryName || product.category || "—";
  };

  // Product image display
  const getProductImage = (product) => {
    const firstImage = product.images?.[0];

    if (typeof firstImage === "string") return firstImage;
    return firstImage?.url || "";
  };

  const filteredProducts = products.filter((product) => {
    const term = search.toLowerCase();

    return (
      (product.productName || product.name || "")
        .toLowerCase()
        .includes(term) ||
      getCategoryName(product).toLowerCase().includes(term) ||
      String(product._id || "").toLowerCase().includes(term)
    );
  });

  // Close popup with Escape key
  useEffect(() => {
    if (!formOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") resetForm();
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [formOpen]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Product Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your products, prices, stock, and availability.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <FiPlus size={19} />
            Add Product
          </button>
        </div>

        {/* Product List */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <FiPackage className="text-indigo-600" />
                All Products
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {products.length} product{products.length !== 1 ? "s" : ""}{" "}
                available
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 sm:w-64"
                />
              </div>

              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center">
              <div className="text-center">
                <FiRefreshCw className="mx-auto animate-spin text-2xl text-indigo-600" />
                <p className="mt-3 text-sm text-slate-500">
                  Loading products...
                </p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <FiPackage className="mx-auto text-4xl text-slate-300" />
              <h3 className="mt-3 font-semibold text-slate-800">
                {search ? "No matching products found" : "No products yet"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try a different search term."
                  : "Click Add Product to create your first product."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <FiPlus />
                  Add Product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Product</th>
                    <th className="px-5 py-4 font-semibold">Category</th>
                    <th className="px-5 py-4 font-semibold">Price</th>
                    <th className="px-5 py-4 font-semibold">Stock</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => {
                    const image = getProductImage(product);

                    return (
                      <tr
                        key={product._id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {image ? (
                              <img
                                src={image}
                                alt={product.productName || product.name}
                                className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                <FiPackage size={21} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="max-w-xs truncate font-semibold text-slate-900">
                                {product.productName || product.name || "Unnamed product"}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                ID: {String(product._id).slice(-8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {getCategoryName(product)}
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          ₹{Number(product.price || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              Number(product.stock || 0) <= 5
                                ? "font-semibold text-rose-600"
                                : "text-slate-600"
                            }
                          >
                            {product.stock ?? 0}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              product.isAvailable
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {product.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(product)}
                              title="Edit product"
                              className="rounded-lg border border-indigo-100 p-2.5 text-indigo-600 transition hover:bg-indigo-50"
                            >
                              <FiEdit2 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(product)}
                              title="Delete product"
                              className="rounded-lg border border-rose-100 p-2.5 text-rose-600 transition hover:bg-rose-50"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Popup */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) resetForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Popup Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
              <div>
                <h2
                  id="product-modal-title"
                  className="text-xl font-bold text-slate-900"
                >
                  {editingId ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the product details below.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                aria-label="Close product form"
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <FiX size={22} />
              </button>
            </div>

            {/* Scrollable Form */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-5 sm:p-7"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={form.productName}
                    onChange={handleChange}
                    required
                    placeholder="Enter product name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option
                        key={category._id || category.name}
                        value={category._id || category.name}
                      >
                        {category.name || category.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                    placeholder="Enter price"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe your product..."
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Images */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Product Image URLs
                  </label>

                  <div className="space-y-3">
                    {form.images.map((image, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={image}
                          onChange={(event) =>
                            handleImageChange(index, event.target.value)
                          }
                          placeholder="https://example.com/product-image.jpg"
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                        />

                        {form.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            title="Remove image"
                            className="rounded-xl border border-rose-100 px-3 text-rose-600 hover:bg-rose-50"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addImageField}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <FiPlus />
                    Add another image
                  </button>
                </div>

                {/* Availability */}
                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={form.isAvailable}
                      onChange={handleChange}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        Product is available
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Customers can see this product as available.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Popup Footer */}
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <FiRefreshCw className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiPlus />
                      {editingId ? "Update Product" : "Create Product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
