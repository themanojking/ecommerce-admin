
import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Products from "./pages/Products";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import Categories from "./pages/Categories";
import ShippingAmount from "./pages/ShippingAmount";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Sidebar from "./components/Sidebar";

import { Toaster } from "react-hot-toast";

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          collapsed ? "lg:ml-24" : "lg:ml-64"
        }`}
      >
        <div className="px-4 pb-8 pt-20 sm:px-8 lg:pt-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/orders" element={<Orders />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route
              path="/admin/shipping-amount"
              element={<ShippingAmount />}
            />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      <Routes>
        <Route path="/login" element={<AdminLogin />} />

        <Route element={<AdminProtectedRoute />}>
          <Route path="/*" element={<AdminLayout />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
