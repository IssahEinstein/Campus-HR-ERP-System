import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/layout/Navbar";

import LoginPage from "./pages/LoginPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import ProfileSettings from "./pages/ProfileSettings";

import WorkerDashboard from "./pages/worker/Dashboard";
import WorkerSchedule from "./pages/worker/Schedule";
import WorkerPayroll from "./pages/worker/Payroll";
import WorkerRequests from "./pages/worker/Requests";
import WorkerFeedback from "./pages/worker/Feedback";
import RequestTimeOff from "./pages/worker/RequestTimeOff";
import UpdateAvailability from "./pages/worker/UpdateAvailability";
import ShiftSwap from "./pages/worker/ShiftSwap";

import SupervisorDashboard from "./pages/supervisor/Dashboard";
import SupervisorTeam from "./pages/supervisor/Team";
import SupervisorSchedule from "./pages/supervisor/Schedule";
import SupervisorApprovals from "./pages/supervisor/Approvals";
import WorkerProfile from "./pages/supervisor/WorkerProfile";

import AdminDashboard from "./pages/admin/Dashboard";

function AppLayout() {
  return (
    <div className="app-shell-background">
      <Navbar />
      <main className="app-shell-content">
        <Outlet />
      </main>
    </div>
  );
}

function RoleHomeRedirect() {
  const { user, initializing } = useAuth();
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00523E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RoleHomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />

          <Route element={<PrivateRoute allowedRoles={["WORKER"]} />}>
            <Route element={<AppLayout />}>
              <Route path="/worker/dashboard" element={<WorkerDashboard />} />
              <Route path="/worker/schedule" element={<WorkerSchedule />} />
              <Route path="/worker/payroll" element={<WorkerPayroll />} />
              <Route path="/worker/requests" element={<WorkerRequests />} />
              <Route path="/worker/feedback" element={<WorkerFeedback />} />
              <Route path="/worker/profile" element={<ProfileSettings />} />
              <Route
                path="/worker/request-time-off"
                element={<RequestTimeOff />}
              />
              <Route
                path="/worker/update-availability"
                element={<UpdateAvailability />}
              />
              <Route path="/worker/shift-swap" element={<ShiftSwap />} />
            </Route>
          </Route>

          <Route element={<PrivateRoute allowedRoles={["SUPERVISOR"]} />}>
            <Route element={<AppLayout />}>
              <Route
                path="/supervisor/dashboard"
                element={<SupervisorDashboard />}
              />
              <Route path="/supervisor/team" element={<SupervisorTeam />} />
              <Route
                path="/supervisor/team/:workerId"
                element={<WorkerProfile />}
              />
              <Route
                path="/supervisor/schedule"
                element={<SupervisorSchedule />}
              />
              <Route
                path="/supervisor/approvals"
                element={<SupervisorApprovals />}
              />
              <Route path="/supervisor/profile" element={<ProfileSettings />} />
            </Route>
          </Route>

          <Route element={<PrivateRoute allowedRoles={["ADMIN"]} />}>
            <Route element={<AppLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/profile" element={<ProfileSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
