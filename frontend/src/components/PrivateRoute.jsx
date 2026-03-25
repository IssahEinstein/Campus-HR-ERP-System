import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Renders <Outlet /> if the user is authenticated AND has an allowed role.
 * Otherwise redirects to /login.
 *
 * Usage:
 *   <Route element={<PrivateRoute allowedRoles={["WORKER"]} />}>
 *     <Route path="/worker/dashboard" element={<WorkerDashboard />} />
 *   </Route>
 */
export default function PrivateRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard instead of a blank 403
    const fallback = `/${user.role.toLowerCase()}/dashboard`;
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
