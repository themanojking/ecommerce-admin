import React, { useEffect, useMemo, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import api from "../services/api";
import {
  FiPlus,
  FiX,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiPackage,
  FiSearch,
  FiTag,
  FiDollarSign,
  FiBox,
  FiFileText,
  FiImage,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiSave,
  FiLayers,
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

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    AOS.init({
      duration: 650,
      easing: "ease-out-cubic",
      once: true,
      offset: 30,
    });
  }, []);

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
      toast.error(error.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get category name safely (name only, never the id)
  const getCategoryName = (product) => {
    const productCategory = product.category;

    if (productCategory && typeof productCategory === "object") {
      return productCategory.name || productCategory.categoryName || "";
    }

    // Match category ID to category name for older products
    const matchedCategory = categories.find(
      (category) => String(category._id) === String(productCategory)
    );

    if (matchedCategory) {
      return matchedCategory.name || matchedCategory.categoryName || "";
    }

    return productCategory || "";
  };

  // Open empty form for adding a product
  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...initialForm, images: [""] });
    setFormOpen(true);
  };

  // Close popup and reset form
  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...initialForm, images: [""] });
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
    setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));
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
      category: getCategoryName(product),
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

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      toast.error("Enter a valid product price");
      return;
    }

    if (
      form.stock === "" ||
      !Number.isInteger(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      toast.error("Stock must be a non-negative whole number");
      return;
    }

    if (!form.category.trim()) {
      toast.error("Please select a category");
      return;
    }

    const payload = {
      ...form,
      productName: form.productName.trim(),
      description: form.description.trim(),
      // Save the category NAME, not the category ID
      category: form.category.trim(),
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
      toast.error(error.response?.data?.message || "Failed to save product");
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
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  };

  // Product image display
  const getProductImage = (product) => {
    const firstImage = product.images?.[0];

    if (typeof firstImage === "string") return firstImage;
    return firstImage?.url || "";
  };

  // Filter products (by name or category name)
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter(
      (product) =>
        (product.productName || product.name || "")
          .toLowerCase()
          .includes(term) ||
        getCategoryName(product).toLowerCase().includes(term)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categories, search]);

  // Quick stats
  const stats = useMemo(() => {
    const available = products.filter((p) => p.isAvailable).length;
    const out = products.filter((p) => Number(p.stock || 0) <= 0).length;
    const low = products.filter((p) => {
      const stock = Number(p.stock || 0);
      return stock > 0 && stock <= 5;
    }).length;

    return { total: products.length, available, low, out };
  }, [products]);

  const statCards = [
    {
      label: "Total products",
      value: stats.total,
      icon: FiLayers,
      gradient: "from-indigo-500 to-violet-600",
      glow: "bg-indigo-500/10",
    },
    {
      label: "Available",
      value: stats.available,
      icon: FiCheckCircle,
      gradient: "from-emerald-500 to-teal-600",
      glow: "bg-emerald-500/10",
    },
    {
      label: "Low stock",
      value: stats.low,
      icon: FiAlertTriangle,
      gradient: "from-amber-400 to-orange-500",
      glow: "bg-amber-500/10",
    },
    {
      label: "Out of stock",
      value: stats.out,
      icon: FiXCircle,
      gradient: "from-rose-500 to-pink-600",
      glow: "bg-rose-500/10",
    },
  ];

  // Re-scan AOS whenever the list changes
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => AOS.refreshHard(), 100);
      return () => clearTimeout(t);
    }
  }, [loading, filteredProducts]);

  // Close popup with Escape key and lock page scroll while it is open
  useEffect(() => {
    if (!formOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") resetForm();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [formOpen]);

  const StockCell = ({ stock }) => {
    const qty = Number(stock || 0);
    const out = qty <= 0;
    const low = qty > 0 && qty <= 5;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
          out
            ? "bg-rose-50 text-rose-700"
            : low
              ? "bg-amber-50 text-amber-700"
              : "bg-slate-100 text-slate-700"
        }`}
      >
        {(out || low) && <FiAlertTriangle size={12} />}
        {out ? "Out of stock" : qty}
      </span>
    );
  };

  const StatusBadge = ({ available }) => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        available
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {available ? <FiCheckCircle size={12} /> : <FiXCircle size={12} />}
      {available ? "Available" : "Unavailable"}
    </span>
  );

  const ProductThumb = ({ product, size = "h-12 w-12" }) => {
    const image = getProductImage(product);

    return image ? (
      <img
        src={image}
        alt={product.productName || product.name}
        loading="lazy"
        className={`${size} shrink-0 rounded-xl border border-slate-200 object-cover`}
      />
    ) : (
      <div
        className={`${size} flex shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400`}
      >
        <FiPackage size={21} />
      </div>
    );
  };

  const ActionButtons = ({ product }) => (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => handleEdit(product)}
        title="Edit product"
        aria-label="Edit product"
        className="group rounded-lg border border-indigo-100 p-2.5 text-indigo-600 transition hover:bg-indigo-600 hover:text-white active:scale-90"
      >
        <FiEdit2
          size={16}
          className="transition-transform group-hover:rotate-12"
        />
      </button>

      <button
        type="button"
        onClick={() => handleDelete(product)}
        title="Delete product"
        aria-label="Delete product"
        className="group rounded-lg border border-rose-100 p-2.5 text-rose-600 transition hover:bg-rose-600 hover:text-white active:scale-90"
      >
        <FiTrash2
          size={16}
          className="transition-transform group-hover:-rotate-12"
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6 lg:p-8">
      <style>{`
        @keyframes pmModalIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pmFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pmFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .pm-modal-in { animation: pmModalIn 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
        .pm-fade { animation: pmFade 0.25s ease-out; }
        .pm-float { animation: pmFloat 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pm-modal-in, .pm-fade, .pm-float { animation: none; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div
          data-aos="fade-down"
          className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 text-white shadow-xl shadow-indigo-900/20 sm:p-8"
        >
          <div className="pm-float pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-fuchsia-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                data-aos="fade-right"
                data-aos-delay="100"
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur"
              >
                <FiPackage size={13} />
                Inventory
              </p>

              <h1
                data-aos="fade-right"
                data-aos-delay="200"
                className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl"
              >
                Product Management
              </h1>

              <p
                data-aos="fade-right"
                data-aos-delay="300"
                className="mt-2 max-w-xl text-sm leading-6 text-indigo-50/90"
              >
                Manage your products, prices, stock, and availability.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddForm}
              data-aos="fade-left"
              data-aos-delay="300"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-xl active:scale-95"
            >
              <FiPlus
                size={19}
                className="transition-transform duration-300 group-hover:rotate-90"
              />
              Add Product
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <section
          aria-label="Product statistics"
          className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {statCards.map(({ label, value, icon: Icon, gradient, glow }, index) => (
            <article
              key={label}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5"
            >
              <div
                className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full transition-transform duration-500 group-hover:scale-150 ${glow}`}
              />

              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">
                    {label}
                  </p>
                  {loading ? (
                    <div className="mt-3 h-7 w-12 animate-pulse rounded-lg bg-slate-100" />
                  ) : (
                    <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
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

        {/* Product List */}
        <div
          data-aos="fade-up"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                <FiPackage size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  All Products
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {products.length} product
                  {products.length !== 1 ? "s" : ""} available
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or category..."
                  aria-label="Search products"
                  className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:w-72"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition hover:rotate-90 hover:text-slate-700"
                  >
                    <FiX size={15} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div data-aos="zoom-in" className="px-4 py-16 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FiPackage size={28} />
              </span>
              <h3 className="mt-4 font-semibold text-slate-800">
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
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
                >
                  <FiPlus />
                  Add Product
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {filteredProducts.map((product, index) => (
                  <li
                    key={product._id}
                    data-aos="fade-up"
                    data-aos-delay={Math.min(index, 5) * 60}
                    className="space-y-3 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <ProductThumb product={product} size="h-16 w-16" />

                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold text-slate-900">
                          {product.productName ||
                            product.name ||
                            "Unnamed product"}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                          <FiTag size={11} />
                          {getCategoryName(product) || "—"}
                        </p>
                        <p className="mt-2 text-base font-bold text-slate-900">
                          ₹{Number(product.price || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StockCell stock={product.stock} />
                        <StatusBadge available={product.isAvailable} />
                      </div>
                      <ActionButtons product={product} />
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <FiPackage size={13} /> Product
                        </span>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <FiTag size={13} /> Category
                        </span>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <FiDollarSign size={13} /> Price
                        </span>
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <FiBox size={13} /> Stock
                        </span>
                      </th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((product, index) => (
                      <tr
                        key={product._id}
                        data-aos="fade"
                        data-aos-delay={Math.min(index, 8) * 40}
                        className="transition hover:bg-indigo-50/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ProductThumb product={product} />

                            <p className="max-w-xs truncate font-semibold text-slate-900">
                              {product.productName ||
                                product.name ||
                                "Unnamed product"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                            <FiTag size={11} />
                            {getCategoryName(product) || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-900">
                          ₹{Number(product.price || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="px-5 py-4">
                          <StockCell stock={product.stock} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge available={product.isAvailable} />
                        </td>

                        <td className="px-5 py-4">
                          <ActionButtons product={product} />
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

      {/* Add/Edit Product Popup */}
      {formOpen && (
        <div
          className="pm-fade fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) resetForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="pm-modal-in flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Popup Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                  {editingId ? <FiEdit2 size={19} /> : <FiPlus size={21} />}
                </span>
                <div>
                  <h2
                    id="product-modal-title"
                    className="text-xl font-bold text-slate-900"
                  >
                    {editingId ? "Edit Product" : "Add New Product"}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Enter the product details below.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetForm}
                aria-label="Close product form"
                className="rounded-xl p-2 text-slate-500 transition hover:rotate-90 hover:bg-slate-100 hover:text-slate-900"
              >
                <FiX size={22} />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-7">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Product Name *
                  </label>
                  <div className="relative">
                    <FiPackage className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="productName"
                      value={form.productName}
                      onChange={handleChange}
                      required
                      placeholder="Enter product name"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category *
                  </label>
                  <div className="relative">
                    <FiTag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">Select category</option>

                      {categories.map((category) => {
                        const categoryName =
                          category.name || category.categoryName || "";

                        return (
                          <option
                            key={category._id || categoryName}
                            value={categoryName}
                          >
                            {categoryName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      required
                      placeholder="Enter price"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Stock Quantity *
                  </label>
                  <div className="relative">
                    <FiBox className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Availability toggle */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Availability
                  </label>
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-2.5 transition hover:bg-slate-50">
                    <span className="flex min-w-0 items-center gap-2">
                      {form.isAvailable ? (
                        <FiCheckCircle className="shrink-0 text-emerald-500" />
                      ) : (
                        <FiXCircle className="shrink-0 text-slate-400" />
                      )}
                      <span className="truncate text-sm font-semibold text-slate-800">
                        {form.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={form.isAvailable}
                      onChange={handleChange}
                      className="peer sr-only"
                    />
                    <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-indigo-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-100" />
                  </label>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>
                  <div className="relative">
                    <FiFileText className="absolute left-3.5 top-4 text-slate-400" />
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Describe your product..."
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Product Image URLs
                  </label>

                  <div className="space-y-3">
                    {form.images.map((image, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-slate-300">
                          {image.trim() ? (
                            <img
                              src={image}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FiImage size={18} />
                          )}
                        </div>

                        <div className="relative min-w-0 flex-1">
                          <FiImage className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="url"
                            value={image}
                            onChange={(event) =>
                              handleImageChange(index, event.target.value)
                            }
                            placeholder="https://example.com/product-image.jpg"
                            className={inputClass}
                          />
                        </div>

                        {form.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            title="Remove image"
                            aria-label="Remove image"
                            className="rounded-xl border border-rose-100 p-3 text-rose-600 transition hover:bg-rose-600 hover:text-white active:scale-90"
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
                    className="group mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <FiPlus className="transition-transform duration-300 group-hover:rotate-90" />
                    Add another image
                  </button>
                </div>
              </div>

              {/* Popup Footer */}
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-300/40 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <FiRefreshCw className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingId ? <FiSave /> : <FiPlus />}
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