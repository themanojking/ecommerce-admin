
import { Navigate, Outlet } from "react-router-dom";

const AdminProtectedRoute = () => {
  const token = localStorage.getItem("adminToken");

  let adminUser = null;

  try {
    adminUser = JSON.parse(
      localStorage.getItem("adminUser") || "null"
    );
  } catch {
    adminUser = null;
  }

  if (!token || adminUser?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
