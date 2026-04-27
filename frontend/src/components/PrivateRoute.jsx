import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Renders <Outlet /> if the user is authenticated AND has an allowed role.
 * Shows a loading spinner while the auth state is being initialised from
 * localStorage (prevents a premature redirect to /login on hard refresh).
 * Otherwise redirects to /login.
 *
 * Usage:
 *   <Route element={<PrivateRoute allowedRoles={["WORKER"]} />}>
 *     <Route path="/worker/dashboard" element={<WorkerDashboard />} />
 *   </Route>
 */
export default function PrivateRoute({ allowedRoles }) {
  const { user, initializing } = useAuth();

  // Still verifying the stored token — don't redirect yet
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00523E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard instead of a blank 403
    const fallback = `/${user.role.toLowerCase()}/dashboard`;
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
