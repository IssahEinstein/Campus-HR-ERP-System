import React, { useState } from "react";
import {
  Calendar,
  Clock,
  DollarSign,
  Bell,
  ChevronRight,
  Menu,
  X,
  MapPin,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  CheckCircle,
  LogIn,
  LogOut,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Plus,
  Users,
  Repeat,
  Download,
  Printer,
  Star,
} from "lucide-react";

export default function CampusJobERPMVP() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedPayStub, setSelectedPayStub] = useState(null);
  const [showCreateShiftModal, setShowCreateShiftModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Requests state - can be modified by supervisor approvals
  const [requests, setRequests] = useState([
    {
      id: 1,
      type: "time-off",
      title: "Spring Break Vacation",
      dateRange: "Mar 15-22, 2026",
      reason: "Personal",
      status: "approved",
      submittedDate: "Feb 1, 2026",
      reviewedBy: "Sarah Johnson",
      reviewedDate: "Feb 2, 2026",
      notes: "Approved. Enjoy your break!",
      affectedShifts: 4,
      workerName: "Jordan Smith",
    },
    {
      id: 2,
      type: "time-off",
      title: "Doctor Appointment",
      dateRange: "Feb 25, 2026",
      reason: "Medical",
      status: "pending",
      submittedDate: "Feb 20, 2026",
      reviewedBy: null,
      reviewedDate: null,
      notes: null,
      affectedShifts: 1,
      workerName: "Jordan Smith",
    },
    {
      id: 3,
      type: "shift-swap",
      title: "Swap with Alex Martinez",
      dateRange: "Feb 28, 2026",
      reason: "Personal",
      status: "pending",
      submittedDate: "Feb 19, 2026",
      reviewedBy: null,
      reviewedDate: null,
      notes: null,
      swapWith: "Alex Martinez",
      originalShift: "Student Center • 2:00 PM - 6:00 PM",
      proposedShift: "Library • 10:00 AM - 2:00 PM",
      workerName: "Jordan Smith",
    },
    {
      id: 4,
      type: "availability",
      title: "Updated Weekly Availability",
      dateRange: "Effective Mar 1, 2026",
      reason: "Academic",
      status: "approved",
      submittedDate: "Feb 10, 2026",
      reviewedBy: "Mike Chen",
      reviewedDate: "Feb 11, 2026",
      notes: "Updated for new class schedule",
      workerName: "Jordan Smith",
    },
    {
      id: 5,
      type: "time-off",
      title: "Family Event",
      dateRange: "Mar 5, 2026",
      reason: "Personal",
      status: "denied",
      submittedDate: "Feb 15, 2026",
      reviewedBy: "Sarah Johnson",
      reviewedDate: "Feb 16, 2026",
      notes:
        "Insufficient coverage available. Please request alternative dates.",
      affectedShifts: 1,
      workerName: "Jordan Smith",
    },
  ]);

  // Shifts state - can be modified by supervisor
  const [upcomingShifts, setUpcomingShifts] = useState([
    {
      id: 1,
      location: "Student Center - Front Desk",
      date: "Today",
      time: "2:00 PM - 6:00 PM",
      duration: "4 hrs",
      hours: 4,
      rate: 16,
      supervisor: "Sarah Johnson",
      supervisorPhone: "(555) 123-4567",
      supervisorEmail: "sjohnson@university.edu",
      status: "confirmed",
      address: "123 Campus Drive, Student Center Building",
      instructions:
        "Please arrive 10 minutes early to review the day's tasks. Check-in at the main desk and collect your badge.",
      checkInTime: null,
      checkOutTime: null,
      workerName: "Jordan Smith",
    },
    {
      id: 2,
      location: "Library - Reference Desk",
      date: "Tomorrow",
      time: "10:00 AM - 2:00 PM",
      duration: "4 hrs",
      hours: 4,
      rate: 16,
      supervisor: "Mike Chen",
      supervisorPhone: "(555) 234-5678",
      supervisorEmail: "mchen@university.edu",
      status: "confirmed",
      address: "456 Library Lane, Main Library 2nd Floor",
      instructions:
        "Assist students with research questions and help with computer access. Familiarize yourself with the new database system.",
      checkInTime: null,
      checkOutTime: null,
      workerName: "Jordan Smith",
    },
    {
      id: 3,
      location: "Student Center - Front Desk",
      date: "Thu, Feb 13",
      time: "2:00 PM - 6:00 PM",
      duration: "4 hrs",
      hours: 4,
      rate: 16,
      supervisor: "Sarah Johnson",
      supervisorPhone: "(555) 123-4567",
      supervisorEmail: "sjohnson@university.edu",
      status: "pending",
      address: "123 Campus Drive, Student Center Building",
      instructions:
        "Standard front desk duties. Answer questions and direct visitors to appropriate locations.",
      checkInTime: null,
      checkOutTime: null,
      workerName: "Jordan Smith",
    },
  ]);

  // Performance feedback state
  const [feedbackList, setFeedbackList] = useState([
    {
      id: 1,
      workerName: "Jordan Smith",
      rating: 5,
      category: "Communication",
      comments: "Excellent communication skills with students and staff.",
      supervisorName: "Sarah Johnson",
      date: "Feb 15, 2026",
    },
    {
      id: 2,
      workerName: "Jordan Smith",
      rating: 4,
      category: "Punctuality",
      comments: "Mostly on time, occasional 5-minute delays.",
      supervisorName: "Mike Chen",
      date: "Feb 1, 2026",
    },
  ]);

  const handleLogin = (role) => {
    setUserRole(role);
    setIsLoggedIn(true);
    setActivePage("dashboard");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setActivePage("dashboard");
  };

  // Team roster for supervisor
  const teamRoster = [
    { id: 1, name: "Jordan Smith", role: "Student Worker", rate: 16 },
    { id: 2, name: "Alex Martinez", role: "Student Worker", rate: 16 },
    { id: 3, name: "Maria Garcia", role: "Student Worker", rate: 16 },
    { id: 4, name: "Kevin Chen", role: "Student Worker", rate: 16.5 },
    { id: 5, name: "Sarah Williams", role: "Student Worker", rate: 16 },
    { id: 6, name: "James Brown", role: "Senior Worker", rate: 17 },
    { id: 7, name: "Emily Davis", role: "Student Worker", rate: 16 },
    { id: 8, name: "Michael Johnson", role: "Student Worker", rate: 16 },
  ];

  // Handle creating new shift
  const handleCreateShift = (shiftData) => {
    const newShift = {
      id: upcomingShifts.length + 1,
      ...shiftData,
      status: "confirmed",
      checkInTime: null,
      checkOutTime: null,
    };
    setUpcomingShifts([...upcomingShifts, newShift]);
    setShowCreateShiftModal(false);
  };

  // Handle creating feedback
  const handleCreateFeedback = (feedbackData) => {
    const newFeedback = {
      id: feedbackList.length + 1,
      ...feedbackData,
      supervisorName: "Current Supervisor",
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
    setFeedbackList([...feedbackList, newFeedback]);
    setShowFeedbackModal(false);
  };

  const weekSchedule = [
    { day: "Mon", date: "10", shifts: 1, hours: 4 },
    { day: "Tue", date: "11", shifts: 1, hours: 4 },
    { day: "Wed", date: "12", shifts: 0, hours: 0 },
    { day: "Thu", date: "13", shifts: 1, hours: 4 },
    { day: "Fri", date: "14", shifts: 2, hours: 6 },
    { day: "Sat", date: "15", shifts: 0, hours: 0 },
    { day: "Sun", date: "16", shifts: 1, hours: 3 },
  ];

  const recentActivity = [
    {
      type: "shift",
      message: "Shift completed at Student Center",
      time: "2 hours ago",
    },
    {
      type: "approval",
      message: "Time off request approved",
      time: "1 day ago",
    },
    {
      type: "feedback",
      message: "New feedback from Sarah Johnson",
      time: "2 days ago",
    },
  ];

  // Handle request approval/denial
  const handleRequestAction = (requestId, action, supervisorNotes = "") => {
    setRequests((prevRequests) =>
      prevRequests.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: action,
              reviewedBy:
                userRole === "supervisor"
                  ? "Current Supervisor"
                  : req.reviewedBy,
              reviewedDate: new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
              notes:
                supervisorNotes ||
                (action === "approved" ? "Approved" : "Denied"),
            }
          : req,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* LOGIN PAGE */}
      {!isLoggedIn ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Logo */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-light mb-2">
                Campus
                <span className="font-medium" style={{ color: "#00523E" }}>
                  ERP
                </span>
              </h1>
              <p className="text-gray-600">Campus Job Management System</p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-2xl font-light mb-2">Welcome back</h2>
              <p className="text-gray-600 mb-8">Select your role to continue</p>

              <div className="space-y-4">
                {/* Worker Login */}
                <button
                  onClick={() => handleLogin("worker")}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium mb-1">
                        Student Worker
                      </h3>
                      <p className="text-sm text-gray-600">
                        View your shifts, schedule, and payroll
                      </p>
                    </div>
                    <ChevronRight
                      size={24}
                      className="text-gray-400 group-hover:text-gray-600 transition-colors"
                    />
                  </div>
                </button>

                {/* Supervisor Login */}
                <button
                  onClick={() => handleLogin("supervisor")}
                  className="w-full p-6 border-2 rounded-xl transition-all text-left group hover:opacity-90"
                  style={{ borderColor: "#00523E", backgroundColor: "#00523E" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium mb-1 text-white">
                        Supervisor
                      </h3>
                      <p className="text-sm text-gray-200">
                        Manage your team and approvals
                      </p>
                    </div>
                    <ChevronRight
                      size={24}
                      className="text-gray-300 group-hover:text-white transition-colors"
                    />
                  </div>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  Need help?{" "}
                  <a
                    href="#"
                    className="hover:underline"
                    style={{ color: "#00523E" }}
                  >
                    Contact Support
                  </a>
                </p>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              © 2026 CampusERP. All rights reserved.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* MAIN APP - Only shown when logged in */}
          {/* Top Navigation */}
          <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                  <div className="text-xl font-light tracking-tight">
                    Campus
                    <span className="font-medium" style={{ color: "#00523E" }}>
                      ERP
                    </span>
                  </div>

                  {/* Desktop Navigation */}
                  <div className="hidden md:flex items-center gap-6">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActivePage("dashboard");
                      }}
                      className={`text-sm font-medium ${activePage === "dashboard" ? "" : "text-gray-600 hover:text-gray-900"}`}
                      style={
                        activePage === "dashboard" ? { color: "#00523E" } : {}
                      }
                    >
                      Dashboard
                    </a>
                    {userRole === "worker" && (
                      <>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage("schedule");
                          }}
                          className={`text-sm ${activePage === "schedule" ? "font-medium" : "text-gray-600 hover:text-gray-900"}`}
                          style={
                            activePage === "schedule"
                              ? { color: "#00523E" }
                              : {}
                          }
                        >
                          Schedule
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage("payroll");
                          }}
                          className={`text-sm ${activePage === "payroll" ? "font-medium" : "text-gray-600 hover:text-gray-900"}`}
                          style={
                            activePage === "payroll" ? { color: "#00523E" } : {}
                          }
                        >
                          Payroll
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage("requests");
                          }}
                          className={`text-sm ${activePage === "requests" ? "font-medium" : "text-gray-600 hover:text-gray-900"}`}
                          style={
                            activePage === "requests"
                              ? { color: "#00523E" }
                              : {}
                          }
                        >
                          Requests
                        </a>
                      </>
                    )}
                    {userRole === "supervisor" && (
                      <>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage("team");
                          }}
                          className={`text-sm ${activePage === "team" ? "font-medium" : "text-gray-600 hover:text-gray-900"}`}
                          style={
                            activePage === "team" ? { color: "#00523E" } : {}
                          }
                        >
                          Team
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage("schedule");
                          }}
                          className={`text-sm ${activePage === "schedule" ? "font-medium" : "text-gray-600 hover:text-gray-900"}`}
                          style={
                            activePage === "schedule"
                              ? { color: "#00523E" }
                              : {}
                          }
                        >
                          Schedule
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage("approvals");
                          }}
                          className={`text-sm ${activePage === "approvals" ? "font-medium" : "text-gray-600 hover:text-gray-900"}`}
                          style={
                            activePage === "approvals"
                              ? { color: "#00523E" }
                              : {}
                          }
                        >
                          Approvals
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                    <Bell size={20} className="text-gray-600" />
                    <span
                      className="absolute top-1 right-1 w-2 h-2 rounded-full"
                      style={{ backgroundColor: "#00523E" }}
                    ></span>
                  </button>

                  <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-2 p-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                        style={{ backgroundColor: "#00523E" }}
                      >
                        {userRole === "worker" ? "JD" : "SJ"}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">
                          {userRole === "worker"
                            ? "Jordan Davis"
                            : "Sarah Johnson"}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {userRole}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>

                  <button
                    className="md:hidden p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>
              </div>

              {/* Mobile Menu */}
              {mobileMenuOpen && (
                <div className="md:hidden py-4 border-t border-gray-200">
                  <div className="flex flex-col gap-4">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActivePage("dashboard");
                        setMobileMenuOpen(false);
                      }}
                      className={`text-sm font-medium ${activePage === "dashboard" ? "" : "text-gray-600"}`}
                      style={
                        activePage === "dashboard" ? { color: "#00523E" } : {}
                      }
                    >
                      Dashboard
                    </a>
                    {userRole === "worker" && (
                      <>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage("schedule");
                            setMobileMenuOpen(false);
                          }}
                          className={`text-sm ${activePage === "schedule" ? "font-medium" : "text-gray-600"}`}
                          style={
                            activePage === "schedule"
                              ? { color: "#00523E" }
                              : {}
                          }
                        >
                          Schedule
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage("payroll");
                            setMobileMenuOpen(false);
                          }}
                          className={`text-sm ${activePage === "payroll" ? "font-medium" : "text-gray-600"}`}
                          style={
                            activePage === "payroll" ? { color: "#00523E" } : {}
                          }
                        >
                          Payroll
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage("requests");
                            setMobileMenuOpen(false);
                          }}
                          className={`text-sm ${activePage === "requests" ? "font-medium" : "text-gray-600"}`}
                          style={
                            activePage === "requests"
                              ? { color: "#00523E" }
                              : {}
                          }
                        >
                          Requests
                        </a>
                      </>
                    )}
                    {userRole === "supervisor" && (
                      <>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage("team");
                            setMobileMenuOpen(false);
                          }}
                          className={`text-sm ${activePage === "team" ? "font-medium" : "text-gray-600"}`}
                          style={
                            activePage === "team" ? { color: "#00523E" } : {}
                          }
                        >
                          Team
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage("schedule");
                            setMobileMenuOpen(false);
                          }}
                          className={`text-sm ${activePage === "schedule" ? "font-medium" : "text-gray-600"}`}
                          style={
                            activePage === "schedule"
                              ? { color: "#00523E" }
                              : {}
                          }
                        >
                          Schedule
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActivePage("approvals");
                            setMobileMenuOpen(false);
                          }}
                          className={`text-sm ${activePage === "approvals" ? "font-medium" : "text-gray-600"}`}
                          style={
                            activePage === "approvals"
                              ? { color: "#00523E" }
                              : {}
                          }
                        >
                          Approvals
                        </a>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-600 hover:text-gray-900 text-left pt-2 border-t border-gray-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* WORKER PAGES - Only show when userRole === 'worker' */}
            {userRole === "worker" && (
              <>
                {/* DASHBOARD PAGE */}
                {activePage === "dashboard" && (
                  <>
                    {/* Header */}
                    <div className="mb-8">
                      <h1 className="text-3xl font-light mb-2">
                        Welcome back,{" "}
                        <span
                          className="font-medium"
                          style={{ color: "#00523E" }}
                        >
                          Jordan
                        </span>
                      </h1>
                      <p className="text-gray-600">
                        Here's what's happening with your campus job today.
                      </p>
                    </div>

                    {/* Stats Overview */}
                    <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                      <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center">
                        <Clock size={24} className="text-gray-400 mb-3" />
                        <div className="text-sm text-gray-600 mb-2">
                          This Week
                        </div>
                        <div className="text-3xl font-light mb-1">
                          21<span className="text-lg text-gray-600"> hrs</span>
                        </div>
                        <div className="text-xs text-green-600">
                          +3 from last week
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center">
                        <DollarSign size={24} className="text-gray-400 mb-3" />
                        <div className="text-sm text-gray-600 mb-2">
                          Est. Earnings
                        </div>
                        <div className="text-3xl font-light mb-1">$336</div>
                        <div className="text-xs text-gray-500">
                          at $16.00/hr
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center">
                        <Calendar size={24} className="text-gray-400 mb-3" />
                        <div className="text-sm text-gray-600 mb-2">
                          This Month
                        </div>
                        <div className="text-3xl font-light mb-1">
                          68<span className="text-lg text-gray-600"> hrs</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Feb 1 - Feb 9
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center">
                        <AlertCircle size={24} className="text-gray-400 mb-3" />
                        <div className="text-sm text-gray-600 mb-2">
                          Next Shift
                        </div>
                        <div className="text-3xl font-light mb-1">Today</div>
                        <div className="text-xs text-gray-500">in 4 hours</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - 2/3 width */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Quick Overview Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">
                            Quick Overview
                          </h2>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm text-gray-600">
                                  Next Shift
                                </p>
                                <p className="font-medium">Today at 2:00 PM</p>
                              </div>
                              <button
                                onClick={() => setActivePage("schedule")}
                                className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300"
                              >
                                View Schedule
                              </button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm text-gray-600">
                                  Upcoming Paycheck
                                </p>
                                <p className="font-medium">$672 on Feb 15</p>
                              </div>
                              <button
                                onClick={() => setActivePage("payroll")}
                                className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300"
                              >
                                View Payroll
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - 1/3 width */}
                      <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">
                            Quick Actions
                          </h2>
                          <div className="space-y-3">
                            <button
                              onClick={() => setActivePage("request-time-off")}
                              className="w-full text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium hover:opacity-90"
                              style={{ backgroundColor: "#00523E" }}
                            >
                              Request Time Off
                            </button>
                            <button
                              onClick={() => setActivePage("shift-swap")}
                              className="w-full border border-gray-200 px-4 py-3 rounded-lg hover:border-gray-300 transition-colors text-sm font-medium"
                            >
                              Swap Shift
                            </button>
                            <button
                              onClick={() =>
                                setActivePage("update-availability")
                              }
                              className="w-full border border-gray-200 px-4 py-3 rounded-lg hover:border-gray-300 transition-colors text-sm font-medium"
                            >
                              Update Availability
                            </button>
                          </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">
                            Recent Activity
                          </h2>
                          <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3"
                              >
                                <div
                                  className="w-2 h-2 rounded-full mt-2"
                                  style={{ backgroundColor: "#00523E" }}
                                ></div>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900">
                                    {activity.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {activity.time}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Performance Summary */}
                        <div
                          className="text-white rounded-xl p-6"
                          style={{ backgroundColor: "#00523E" }}
                        >
                          <h2 className="text-lg font-medium mb-4">
                            Performance
                          </h2>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-200">
                                  Punctuality
                                </span>
                                <span className="text-sm font-medium">98%</span>
                              </div>
                              <div className="w-full bg-green-900 bg-opacity-30 rounded-full h-2">
                                <div
                                  className="bg-green-300 h-2 rounded-full"
                                  style={{ width: "98%" }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-200">
                                  Attendance
                                </span>
                                <span className="text-sm font-medium">95%</span>
                              </div>
                              <div className="w-full bg-blue-900 bg-opacity-30 rounded-full h-2">
                                <div
                                  className="bg-blue-300 h-2 rounded-full"
                                  style={{ width: "95%" }}
                                ></div>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-green-800 border-opacity-30">
                              <p className="text-sm text-gray-200">
                                Latest feedback from Sarah Johnson
                              </p>
                              <p className="text-xs text-gray-300 mt-2">
                                "Great job handling the busy afternoon rush!"
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* SCHEDULE PAGE */}
                {activePage === "schedule" && (
                  <>
                    {/* Header */}
                    <div className="mb-8">
                      <h1 className="text-3xl font-light mb-2">
                        <span
                          className="font-medium"
                          style={{ color: "#00523E" }}
                        >
                          Schedule
                        </span>
                      </h1>
                      <p className="text-gray-600">
                        Manage your shifts and availability.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - 2/3 width */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Upcoming Shifts */}
                        <div className="bg-white rounded-xl border border-gray-200">
                          <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <h2 className="text-lg font-medium">
                                Upcoming Shifts
                              </h2>
                              <a
                                href="#"
                                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                              >
                                View all
                                <ChevronRight size={16} />
                              </a>
                            </div>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {upcomingShifts.map((shift) => (
                              <div
                                key={shift.id}
                                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => setSelectedShift(shift)}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <MapPin
                                        size={16}
                                        className="text-gray-400"
                                      />
                                      <h3 className="font-medium">
                                        {shift.location}
                                      </h3>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {shift.date} • {shift.time}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      shift.status === "confirmed"
                                        ? "bg-green-50 text-green-700"
                                        : "bg-yellow-50 text-yellow-700"
                                    }`}
                                  >
                                    {shift.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>{shift.duration}</span>
                                    <span>•</span>
                                    <span>Supervisor: {shift.supervisor}</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedShift(shift);
                                    }}
                                    className="text-sm hover:underline"
                                    style={{ color: "#00523E" }}
                                  >
                                    View Details →
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Weekly Schedule Overview */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-6">
                            This Week
                          </h2>
                          <div className="grid grid-cols-7 gap-2">
                            {weekSchedule.map((day) => (
                              <div
                                key={day.day}
                                className={`text-center p-3 rounded-lg ${
                                  day.shifts > 0
                                    ? "text-white"
                                    : "bg-gray-50 text-gray-400"
                                }`}
                                style={
                                  day.shifts > 0
                                    ? { backgroundColor: "#00523E" }
                                    : {}
                                }
                              >
                                <div className="text-xs mb-1">{day.day}</div>
                                <div className="text-lg font-medium mb-1">
                                  {day.date}
                                </div>
                                <div className="text-xs">
                                  {day.hours > 0 ? `${day.hours}h` : "—"}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              Total this week
                            </span>
                            <span className="font-medium">21 hours</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - 1/3 width */}
                      <div className="space-y-6">
                        {/* Availability */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">
                            My Availability
                          </h2>
                          <div className="space-y-3">
                            <button
                              className="w-full text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium hover:opacity-90"
                              style={{ backgroundColor: "#00523E" }}
                            >
                              Update Availability
                            </button>
                            <button className="w-full border border-gray-200 px-4 py-3 rounded-lg hover:border-gray-300 transition-colors text-sm font-medium">
                              Request Shift Swap
                            </button>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">
                              Current availability:
                            </p>
                            <p className="text-xs text-gray-500">
                              Mon-Fri: 2pm-6pm
                              <br />
                              Sat-Sun: Not available
                            </p>
                          </div>
                        </div>

                        {/* Calendar View */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">
                            February 2026
                          </h2>
                          <div className="text-sm text-gray-600">
                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {["S", "M", "T", "W", "T", "F", "S"].map(
                                (day, i) => (
                                  <div
                                    key={i}
                                    className="text-center text-xs font-medium text-gray-400"
                                  >
                                    {day}
                                  </div>
                                ),
                              )}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {Array.from({ length: 28 }, (_, i) => i + 1).map(
                                (day) => (
                                  <div
                                    key={day}
                                    className={`text-center p-2 text-xs rounded ${
                                      [10, 11, 13, 14, 16].includes(day)
                                        ? "text-white font-medium"
                                        : "text-gray-600"
                                    }`}
                                    style={
                                      [10, 11, 13, 14, 16].includes(day)
                                        ? { backgroundColor: "#00523E" }
                                        : {}
                                    }
                                  >
                                    {day}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* PAYROLL PAGE */}
                {activePage === "payroll" && (
                  <>
                    {/* Header */}
                    <div className="mb-8">
                      <h1 className="text-3xl font-light mb-2">
                        <span
                          className="font-medium"
                          style={{ color: "#00523E" }}
                        >
                          Payroll
                        </span>
                      </h1>
                      <p className="text-gray-600">
                        View your earnings and payment history.
                      </p>
                    </div>

                    {/* Earnings Overview */}
                    <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                      <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center">
                        <Clock size={24} className="text-gray-400 mb-3" />
                        <div className="text-sm text-gray-600 mb-2">
                          Current Period
                        </div>
                        <div className="text-3xl font-light mb-1">
                          21<span className="text-lg text-gray-600"> hrs</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Feb 1 - Feb 15
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center">
                        <DollarSign size={24} className="text-gray-400 mb-3" />
                        <div className="text-sm text-gray-600 mb-2">
                          Projected Earnings
                        </div>
                        <div className="text-3xl font-light mb-1">$336</div>
                        <div className="text-xs text-gray-500">
                          at $16.00/hr
                        </div>
                      </div>

                      <div
                        className="rounded-xl p-6 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center"
                        style={{ backgroundColor: "#00523E" }}
                      >
                        <Calendar size={24} className="text-gray-300 mb-3" />
                        <div className="text-sm text-gray-200 mb-2">
                          Next Paycheck
                        </div>
                        <div className="text-3xl font-light mb-1 text-white">
                          $336
                        </div>
                        <div className="text-xs text-gray-300">
                          Due Feb 15, 2026
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - 2/3 width */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Past Pay Stubs */}
                        <div className="bg-white rounded-xl border border-gray-200">
                          <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-medium">Pay Stubs</h2>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {[
                              {
                                period: "Jan 16 - Jan 31, 2026",
                                hours: 42,
                                gross: 672,
                                net: 588,
                                date: "Feb 1, 2026",
                                status: "Paid",
                                dailyHours: [
                                  {
                                    date: "Jan 16",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 17",
                                    location: "Student Center",
                                    hours: 5,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 18",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 20",
                                    location: "Admin Office",
                                    hours: 6,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 22",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 23",
                                    location: "Student Center",
                                    hours: 5,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 24",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 27",
                                    location: "Admin Office",
                                    hours: 6,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 29",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                ],
                                deductions: {
                                  federalTax: 48.0,
                                  stateTax: 24.0,
                                  fica: 12.0,
                                },
                                ytd: {
                                  grossPay: 2688,
                                  netPay: 2352,
                                  federalTax: 192,
                                  stateTax: 96,
                                  fica: 48,
                                },
                              },
                              {
                                period: "Jan 1 - Jan 15, 2026",
                                hours: 38,
                                gross: 608,
                                net: 532,
                                date: "Jan 16, 2026",
                                status: "Paid",
                                dailyHours: [
                                  {
                                    date: "Jan 2",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 3",
                                    location: "Student Center",
                                    hours: 5,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 6",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 8",
                                    location: "Admin Office",
                                    hours: 5,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 9",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 10",
                                    location: "Student Center",
                                    hours: 5,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 13",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Jan 15",
                                    location: "Admin Office",
                                    hours: 7,
                                    rate: 16,
                                  },
                                ],
                                deductions: {
                                  federalTax: 43.2,
                                  stateTax: 21.6,
                                  fica: 11.2,
                                },
                                ytd: {
                                  grossPay: 2016,
                                  netPay: 1764,
                                  federalTax: 144,
                                  stateTax: 72,
                                  fica: 36,
                                },
                              },
                              {
                                period: "Dec 16 - Dec 31, 2025",
                                hours: 35,
                                gross: 560,
                                net: 490,
                                date: "Jan 2, 2026",
                                status: "Paid",
                                dailyHours: [
                                  {
                                    date: "Dec 16",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 17",
                                    location: "Student Center",
                                    hours: 5,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 18",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 19",
                                    location: "Admin Office",
                                    hours: 5,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 20",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 23",
                                    location: "Student Center",
                                    hours: 5,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 27",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 30",
                                    location: "Admin Office",
                                    hours: 4,
                                    rate: 16,
                                  },
                                ],
                                deductions: {
                                  federalTax: 40.0,
                                  stateTax: 20.0,
                                  fica: 10.0,
                                },
                                ytd: {
                                  grossPay: 1408,
                                  netPay: 1232,
                                  federalTax: 100.8,
                                  stateTax: 50.4,
                                  fica: 24.8,
                                },
                              },
                              {
                                period: "Dec 1 - Dec 15, 2025",
                                hours: 40,
                                gross: 640,
                                net: 560,
                                date: "Dec 16, 2025",
                                status: "Paid",
                                dailyHours: [
                                  {
                                    date: "Dec 2",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 3",
                                    location: "Student Center",
                                    hours: 5,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 4",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 5",
                                    location: "Admin Office",
                                    hours: 5,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 6",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 9",
                                    location: "Student Center",
                                    hours: 5,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 10",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 11",
                                    location: "Admin Office",
                                    hours: 5,
                                    rate: 16,
                                  },
                                  {
                                    date: "Dec 13",
                                    location: "Library",
                                    hours: 4,
                                    rate: 16,
                                  },
                                ],
                                deductions: {
                                  federalTax: 45.6,
                                  stateTax: 22.8,
                                  fica: 11.6,
                                },
                                ytd: {
                                  grossPay: 848,
                                  netPay: 742,
                                  federalTax: 60.8,
                                  stateTax: 30.4,
                                  fica: 14.8,
                                },
                              },
                              {
                                period: "Nov 16 - Nov 30, 2025",
                                hours: 36,
                                gross: 576,
                                net: 504,
                                date: "Dec 1, 2025",
                                status: "Paid",
                              },
                            ].map((stub, index) => (
                              <div
                                key={index}
                                className="p-6 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-medium mb-1">
                                      {stub.period}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      {stub.hours} hours worked
                                    </p>
                                  </div>
                                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                    {stub.status}
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600 mb-1">
                                      Gross Pay
                                    </p>
                                    <p className="font-medium">
                                      ${stub.gross.toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 mb-1">
                                      Net Pay
                                    </p>
                                    <p className="font-medium">
                                      ${stub.net.toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600 mb-1">
                                      Pay Date
                                    </p>
                                    <p className="font-medium">{stub.date}</p>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <button
                                    onClick={() => setSelectedPayStub(stub)}
                                    className="text-sm hover:underline"
                                    style={{ color: "#00523E" }}
                                  >
                                    View Details
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Column - 1/3 width */}
                      <div className="space-y-6">
                        {/* Current Pay Period */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">
                            Current Pay Period
                          </h2>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Period
                              </span>
                              <span className="text-sm font-medium">
                                Feb 1 - Feb 15
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Hours Logged
                              </span>
                              <span className="text-sm font-medium">
                                21 hrs
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Hourly Rate
                              </span>
                              <span className="text-sm font-medium">
                                $16.00
                              </span>
                            </div>
                            <div className="pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  Projected Gross
                                </span>
                                <span
                                  className="text-lg font-medium"
                                  style={{ color: "#00523E" }}
                                >
                                  $336.00
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Estimated net: ~$294.00
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Year to Date */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">
                            2026 Year to Date
                          </h2>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Total Hours
                              </span>
                              <span className="text-sm font-medium">
                                101 hrs
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Gross Earnings
                              </span>
                              <span className="text-sm font-medium">
                                $1,616.00
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Net Earnings
                              </span>
                              <span className="text-sm font-medium">
                                $1,414.00
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">Actions</h2>
                          <div className="space-y-3">
                            <button
                              className="w-full text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium hover:opacity-90"
                              style={{ backgroundColor: "#00523E" }}
                            >
                              Download All Stubs
                            </button>
                            <button className="w-full border border-gray-200 px-4 py-3 rounded-lg hover:border-gray-300 transition-colors text-sm font-medium">
                              Tax Documents
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* REQUESTS PAGE */}
                {activePage === "requests" && (
                  <>
                    {/* Header */}
                    <div className="mb-8">
                      <h1 className="text-3xl font-light mb-2">
                        <span
                          className="font-medium"
                          style={{ color: "#00523E" }}
                        >
                          My Requests
                        </span>
                      </h1>
                      <p className="text-gray-600">
                        Track and manage all your requests in one place.
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <button
                        onClick={() => setActivePage("request-time-off")}
                        className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: "#00523E" }}
                          >
                            <Calendar size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium">Request Time Off</h3>
                            <p className="text-sm text-gray-600">
                              Submit new request
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setActivePage("shift-swap")}
                        className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-600">
                            <RefreshCw size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium">Swap Shift</h3>
                            <p className="text-sm text-gray-600">
                              Trade with coworker
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setActivePage("update-availability")}
                        className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-600">
                            <Clock size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium">Update Availability</h3>
                            <p className="text-sm text-gray-600">
                              Change schedule
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                          style={{ backgroundColor: "#00523E" }}
                        >
                          All Requests
                        </button>
                        <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                          Pending
                        </button>
                        <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                          Approved
                        </button>
                        <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                          Denied
                        </button>
                      </div>
                    </div>

                    {/* Requests List */}
                    <div className="space-y-4">
                      {requests.map((request) => (
                        <div
                          key={request.id}
                          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                              {/* Icon based on type */}
                              <div
                                className={`p-3 rounded-lg ${
                                  request.type === "time-off"
                                    ? "bg-green-50"
                                    : request.type === "shift-swap"
                                      ? "bg-blue-50"
                                      : "bg-purple-50"
                                }`}
                              >
                                {request.type === "time-off" && (
                                  <Calendar
                                    size={24}
                                    className="text-green-600"
                                  />
                                )}
                                {request.type === "shift-swap" && (
                                  <RefreshCw
                                    size={24}
                                    className="text-blue-600"
                                  />
                                )}
                                {request.type === "availability" && (
                                  <Clock
                                    size={24}
                                    className="text-purple-600"
                                  />
                                )}
                              </div>

                              <div>
                                <h3 className="font-medium text-lg mb-1">
                                  {request.title}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  <span>{request.dateRange}</span>
                                  <span>•</span>
                                  <span className="capitalize">
                                    {request.reason}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                request.status === "approved"
                                  ? "bg-green-50 text-green-700"
                                  : request.status === "pending"
                                    ? "bg-yellow-50 text-yellow-700"
                                    : "bg-red-50 text-red-700"
                              }`}
                            >
                              {request.status === "approved" && (
                                <CheckCircle size={14} />
                              )}
                              {request.status === "pending" && (
                                <Clock size={14} />
                              )}
                              {request.status === "denied" && (
                                <XCircle size={14} />
                              )}
                              {request.status.charAt(0).toUpperCase() +
                                request.status.slice(1)}
                            </span>
                          </div>

                          {/* Additional Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Submitted:</span>{" "}
                              <span className="text-gray-900">
                                {request.submittedDate}
                              </span>
                            </div>
                            {request.reviewedDate && (
                              <div>
                                <span className="text-gray-500">Reviewed:</span>{" "}
                                <span className="text-gray-900">
                                  {request.reviewedDate}
                                </span>
                              </div>
                            )}
                            {request.reviewedBy && (
                              <div>
                                <span className="text-gray-500">
                                  Reviewed by:
                                </span>{" "}
                                <span className="text-gray-900">
                                  {request.reviewedBy}
                                </span>
                              </div>
                            )}
                            {request.affectedShifts && (
                              <div>
                                <span className="text-gray-500">
                                  Affected Shifts:
                                </span>{" "}
                                <span className="text-gray-900">
                                  {request.affectedShifts}
                                </span>
                              </div>
                            )}
                            {request.swapWith && (
                              <div>
                                <span className="text-gray-500">
                                  Swap with:
                                </span>{" "}
                                <span className="text-gray-900">
                                  {request.swapWith}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Shift Swap Details */}
                          {request.type === "shift-swap" && (
                            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 mb-1">
                                  Your Shift:
                                </p>
                                <p className="text-gray-900">
                                  {request.originalShift}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">
                                  Their Shift:
                                </p>
                                <p className="text-gray-900">
                                  {request.proposedShift}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Notes/Feedback */}
                          {request.notes && (
                            <div
                              className={`mt-4 p-4 rounded-lg ${
                                request.status === "approved"
                                  ? "bg-green-50 border border-green-200"
                                  : request.status === "denied"
                                    ? "bg-red-50 border border-red-200"
                                    : "bg-gray-50 border border-gray-200"
                              }`}
                            >
                              <p className="text-sm font-medium mb-1">
                                {request.status === "approved"
                                  ? "Approval Note:"
                                  : request.status === "denied"
                                    ? "Denial Reason:"
                                    : "Note:"}
                              </p>
                              <p className="text-sm text-gray-700">
                                {request.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Empty State if no requests */}
                    {requests.length === 0 && (
                      <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                        <FileText
                          size={48}
                          className="mx-auto text-gray-300 mb-4"
                        />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No requests yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Get started by submitting your first request
                        </p>
                        <button
                          onClick={() => setActivePage("request-time-off")}
                          className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-lg transition-colors font-medium hover:opacity-90"
                          style={{ backgroundColor: "#00523E" }}
                        >
                          <Plus size={20} />
                          New Request
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* REQUEST TIME OFF PAGE */}
                {activePage === "request-time-off" && (
                  <>
                    {/* Header with Back Button */}
                    <div className="mb-8">
                      <button
                        onClick={() => setActivePage("dashboard")}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
                      >
                        ← Back to Dashboard
                      </button>
                      <h1 className="text-3xl font-light mb-2">
                        <span
                          className="font-medium"
                          style={{ color: "#00523E" }}
                        >
                          Request Time Off
                        </span>
                      </h1>
                      <p className="text-gray-600">
                        Submit a request for time away from your scheduled
                        shifts.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - Form (2/3 width) */}
                      <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              alert(
                                "Time off request submitted! This would normally save to a database.",
                              );
                              setActivePage("dashboard");
                            }}
                          >
                            {/* Date Range */}
                            <div className="mb-6">
                              <h3 className="text-lg font-medium mb-4">
                                Date Range
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                  </label>
                                  <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                  </label>
                                  <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Reason */}
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason
                              </label>
                              <select
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                <option value="">Select a reason...</option>
                                <option value="personal">Personal</option>
                                <option value="medical">Medical</option>
                                <option value="family">Family Emergency</option>
                                <option value="academic">
                                  Academic Commitment
                                </option>
                                <option value="other">Other</option>
                              </select>
                            </div>

                            {/* Notes */}
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Notes (Optional)
                              </label>
                              <textarea
                                rows={4}
                                placeholder="Provide any additional details about your request..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                              />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3">
                              <button
                                type="submit"
                                className="flex-1 text-white px-6 py-3 rounded-lg transition-colors font-medium hover:opacity-90"
                                style={{ backgroundColor: "#00523E" }}
                              >
                                Submit Request
                              </button>
                              <button
                                type="button"
                                onClick={() => setActivePage("dashboard")}
                                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>

                      {/* Right Column - Impact Preview (1/3 width) */}
                      <div className="space-y-6">
                        {/* Impact Preview */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-medium mb-4">
                            Affected Shifts
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Select dates above to see which shifts will be
                            impacted
                          </p>

                          {/* Sample affected shifts - in real app, this would be dynamic */}
                          <div className="space-y-3">
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircle
                                  size={16}
                                  className="text-yellow-600 mt-0.5 flex-shrink-0"
                                />
                                <div>
                                  <p className="text-sm font-medium text-yellow-900">
                                    Feb 12, 2026
                                  </p>
                                  <p className="text-xs text-yellow-700">
                                    Student Center • 2:00 PM - 6:00 PM
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircle
                                  size={16}
                                  className="text-yellow-600 mt-0.5 flex-shrink-0"
                                />
                                <div>
                                  <p className="text-sm font-medium text-yellow-900">
                                    Feb 13, 2026
                                  </p>
                                  <p className="text-xs text-yellow-700">
                                    Library • 10:00 AM - 2:00 PM
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Guidelines */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText size={16} className="text-blue-900" />
                            <h3 className="text-sm font-medium text-blue-900">
                              Guidelines
                            </h3>
                          </div>
                          <ul className="text-xs text-blue-800 space-y-2">
                            <li>
                              • Submit requests at least 2 weeks in advance when
                              possible
                            </li>
                            <li>
                              • Emergency requests will be reviewed within 24
                              hours
                            </li>
                            <li>
                              • You'll receive email notification when reviewed
                            </li>
                            <li>
                              • Approved time off will update your schedule
                              automatically
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* UPDATE AVAILABILITY PAGE */}
                {activePage === "update-availability" && (
                  <>
                    {/* Header with Back Button */}
                    <div className="mb-8">
                      <button
                        onClick={() => setActivePage("dashboard")}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
                      >
                        ← Back to Dashboard
                      </button>
                      <h1 className="text-3xl font-light mb-2">
                        <span
                          className="font-medium"
                          style={{ color: "#00523E" }}
                        >
                          Update Availability
                        </span>
                      </h1>
                      <p className="text-gray-600">
                        Manage when you're available to work each week.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - Availability Grid (2/3 width) */}
                      <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-medium mb-6">
                            Weekly Availability
                          </h3>

                          {/* Time Slots Grid */}
                          <div className="space-y-4">
                            {[
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                              "Sunday",
                            ].map((day) => (
                              <div
                                key={day}
                                className="border border-gray-200 rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-gray-900">
                                    {day}
                                  </h4>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      defaultChecked={
                                        day !== "Saturday" && day !== "Sunday"
                                      }
                                      className="w-4 h-4 rounded border-gray-300"
                                      style={{ accentColor: "#00523E" }}
                                    />
                                    <span className="text-sm text-gray-600">
                                      Available
                                    </span>
                                  </label>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                      From
                                    </label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                      <option>8:00 AM</option>
                                      <option>9:00 AM</option>
                                      <option selected>10:00 AM</option>
                                      <option>11:00 AM</option>
                                      <option>12:00 PM</option>
                                      <option>1:00 PM</option>
                                      <option>2:00 PM</option>
                                      <option>3:00 PM</option>
                                      <option>4:00 PM</option>
                                      <option>5:00 PM</option>
                                      <option>6:00 PM</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                      To
                                    </label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                      <option>12:00 PM</option>
                                      <option>1:00 PM</option>
                                      <option>2:00 PM</option>
                                      <option>3:00 PM</option>
                                      <option>4:00 PM</option>
                                      <option selected>5:00 PM</option>
                                      <option>6:00 PM</option>
                                      <option>7:00 PM</option>
                                      <option>8:00 PM</option>
                                      <option>9:00 PM</option>
                                      <option>10:00 PM</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Change Type */}
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="font-medium mb-4">Change Type</h4>
                            <div className="space-y-3">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name="changeType"
                                  defaultChecked
                                  className="mt-1"
                                  style={{ accentColor: "#00523E" }}
                                />
                                <div>
                                  <p className="font-medium text-sm">
                                    Recurring
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Apply to all future weeks
                                  </p>
                                </div>
                              </label>
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name="changeType"
                                  className="mt-1"
                                  style={{ accentColor: "#00523E" }}
                                />
                                <div>
                                  <p className="font-medium text-sm">
                                    One-time
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Apply to specific date range only
                                  </p>
                                </div>
                              </label>
                            </div>
                          </div>

                          {/* Effective Date */}
                          <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Effective Starting
                            </label>
                            <input
                              type="date"
                              defaultValue="2026-03-01"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>

                          {/* Reason */}
                          <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Reason for Change
                            </label>
                            <select
                              required
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                              <option value="">Select a reason...</option>
                              <option value="academic">
                                Class Schedule Change
                              </option>
                              <option value="personal">
                                Personal Commitment
                              </option>
                              <option value="other-job">Other Job</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          {/* Notes */}
                          <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Additional Notes (Optional)
                            </label>
                            <textarea
                              rows={3}
                              placeholder="Provide any additional details..."
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            />
                          </div>

                          {/* Submit Buttons */}
                          <div className="flex gap-3 mt-6">
                            <button
                              onClick={() => {
                                alert(
                                  "Availability update submitted for supervisor approval!",
                                );
                                setActivePage("dashboard");
                              }}
                              className="flex-1 text-white px-6 py-3 rounded-lg transition-colors font-medium hover:opacity-90"
                              style={{ backgroundColor: "#00523E" }}
                            >
                              Submit for Approval
                            </button>
                            <button
                              onClick={() => setActivePage("dashboard")}
                              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Info & Current Availability (1/3 width) */}
                      <div className="space-y-6">
                        {/* Current Availability Summary */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-medium mb-4">
                            Current Availability
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">
                                Total Hours/Week
                              </span>
                              <span className="font-medium">35 hrs</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">
                                Available Days
                              </span>
                              <span className="font-medium">5 days</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">
                                Last Updated
                              </span>
                              <span className="font-medium">Feb 10, 2026</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-sm font-medium mb-3">
                            Quick Presets
                          </h3>
                          <div className="space-y-2">
                            <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 border border-gray-200">
                              Weekdays Only (M-F)
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 border border-gray-200">
                              Weekends Only (S-S)
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 border border-gray-200">
                              Full Week (M-S)
                            </button>
                          </div>
                        </div>

                        {/* Guidelines */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText size={16} className="text-blue-900" />
                            <h3 className="text-sm font-medium text-blue-900">
                              Guidelines
                            </h3>
                          </div>
                          <ul className="text-xs text-blue-800 space-y-2">
                            <li>• Submit changes at least 1 week in advance</li>
                            <li>
                              • Supervisor approval required for all updates
                            </li>
                            <li>
                              • Current shifts won't be affected automatically
                            </li>
                            <li>• Changes apply to future scheduling only</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* SHIFT SWAP REQUEST PAGE */}
                {activePage === "shift-swap" && (
                  <>
                    <div className="mb-6">
                      <button
                        onClick={() => setActivePage("schedule")}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                      >
                        <ChevronRight size={16} className="rotate-180" />
                        Back to Schedule
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Repeat size={24} className="text-green-700" />
                        <h2 className="text-2xl font-bold text-gray-900">
                          Request Shift Swap
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Form */}
                        <div className="lg:col-span-2 space-y-6">
                          {/* Select Shift to Swap */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Select Shift to Swap
                            </label>
                            <div className="space-y-3">
                              {upcomingShifts.slice(0, 3).map((shift, idx) => (
                                <div
                                  key={idx}
                                  className="border border-gray-200 rounded-lg p-4 hover:border-green-700 hover:bg-green-50 cursor-pointer transition-all"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <input
                                          type="radio"
                                          name="shiftToSwap"
                                          id={`shift-${idx}`}
                                          className="w-4 h-4 text-green-700 focus:ring-green-700"
                                        />
                                        <label
                                          htmlFor={`shift-${idx}`}
                                          className="font-medium text-gray-900"
                                        >
                                          {shift.location}
                                        </label>
                                      </div>
                                      <div className="ml-6 space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Calendar size={14} />
                                          {shift.date}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Clock size={14} />
                                          {shift.time}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <DollarSign size={14} />
                                          {shift.hours} hrs × ${shift.rate}/hr =
                                          ${shift.hours * shift.rate}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Available Workers */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Select Worker to Swap With
                            </label>
                            <div className="space-y-3">
                              {[
                                {
                                  name: "Alex Johnson",
                                  availability: "Available",
                                  swapScore: "95%",
                                  lastSwap: "2 months ago",
                                },
                                {
                                  name: "Maria Garcia",
                                  availability: "Available",
                                  swapScore: "88%",
                                  lastSwap: "Never",
                                },
                                {
                                  name: "Kevin Chen",
                                  availability: "Maybe",
                                  swapScore: "92%",
                                  lastSwap: "3 weeks ago",
                                },
                                {
                                  name: "Sarah Williams",
                                  availability: "Available",
                                  swapScore: "90%",
                                  lastSwap: "1 month ago",
                                },
                              ].map((worker, idx) => (
                                <div
                                  key={idx}
                                  className="border border-gray-200 rounded-lg p-4 hover:border-green-700 hover:bg-green-50 cursor-pointer transition-all"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                      <input
                                        type="radio"
                                        name="swapWorker"
                                        id={`worker-${idx}`}
                                        className="w-4 h-4 text-green-700 focus:ring-green-700"
                                      />
                                      <div className="flex-1">
                                        <label
                                          htmlFor={`worker-${idx}`}
                                          className="font-medium text-gray-900 block"
                                        >
                                          {worker.name}
                                        </label>
                                        <div className="flex items-center gap-4 mt-1">
                                          <span
                                            className={`text-xs px-2 py-1 rounded ${
                                              worker.availability ===
                                              "Available"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-yellow-100 text-yellow-800"
                                            }`}
                                          >
                                            {worker.availability}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            Match: {worker.swapScore}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            Last swap: {worker.lastSwap}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Propose Alternative Shift (Optional) */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Propose Alternative Shift (Optional)
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                              Offer to cover one of their shifts in exchange
                            </p>
                            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent text-sm">
                              <option value="">
                                No alternative shift (one-way swap)
                              </option>
                              <option value="shift1">
                                Mon, Mar 3 - Library Circulation (2:00 PM - 6:00
                                PM)
                              </option>
                              <option value="shift2">
                                Wed, Mar 5 - Student Center (1:00 PM - 5:00 PM)
                              </option>
                              <option value="shift3">
                                Fri, Mar 7 - Admin Office (9:00 AM - 1:00 PM)
                              </option>
                            </select>
                          </div>

                          {/* Reason for Swap */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Reason for Swap *
                            </label>
                            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent text-sm mb-3">
                              <option value="">Select a reason</option>
                              <option value="class">Class Conflict</option>
                              <option value="exam">Exam Schedule</option>
                              <option value="personal">
                                Personal Emergency
                              </option>
                              <option value="family">Family Commitment</option>
                              <option value="other-job">
                                Other Job Conflict
                              </option>
                              <option value="other">Other</option>
                            </select>

                            <textarea
                              placeholder="Additional details (optional)"
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent text-sm resize-none"
                            />
                          </div>

                          {/* Submit Button */}
                          <div className="flex gap-3">
                            <button className="flex-1 bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                              Submit Swap Request
                            </button>
                            <button
                              onClick={() => setActivePage("schedule")}
                              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                          {/* Swap Summary */}
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">
                              Swap Summary
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Your Shift
                                </p>
                                <p className="text-sm text-gray-900 font-medium">
                                  Not selected
                                </p>
                              </div>
                              <div className="border-t border-gray-200 pt-3">
                                <p className="text-xs text-gray-500 mb-1">
                                  Swap With
                                </p>
                                <p className="text-sm text-gray-900 font-medium">
                                  Not selected
                                </p>
                              </div>
                              <div className="border-t border-gray-200 pt-3">
                                <p className="text-xs text-gray-500 mb-1">
                                  Alternative Shift
                                </p>
                                <p className="text-sm text-gray-900 font-medium">
                                  None
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Approval Process */}
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-3">
                              <FileText size={16} className="text-blue-900" />
                              <h3 className="text-sm font-medium text-blue-900">
                                Approval Process
                              </h3>
                            </div>
                            <ol className="text-xs text-blue-800 space-y-2">
                              <li>1. Worker agrees to swap</li>
                              <li>2. Supervisor reviews request</li>
                              <li>3. Both parties notified of decision</li>
                              <li>4. Schedules updated automatically</li>
                            </ol>
                          </div>

                          {/* Swap Statistics */}
                          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-3">
                              <Repeat size={16} className="text-green-900" />
                              <h3 className="text-sm font-medium text-green-900">
                                Your Swap Stats
                              </h3>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-green-800">
                                  Total Swaps
                                </span>
                                <span className="font-medium text-green-900">
                                  3
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-green-800">
                                  Pending Requests
                                </span>
                                <span className="font-medium text-green-900">
                                  0
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-green-800">
                                  Approval Rate
                                </span>
                                <span className="font-medium text-green-900">
                                  100%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Guidelines */}
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertCircle
                                size={16}
                                className="text-yellow-900"
                              />
                              <h3 className="text-sm font-medium text-yellow-900">
                                Swap Guidelines
                              </h3>
                            </div>
                            <ul className="text-xs text-yellow-800 space-y-2">
                              <li>• Request at least 48 hours in advance</li>
                              <li>• Both parties must agree to swap</li>
                              <li>• Supervisor has final approval</li>
                              <li>• You're responsible until approved</li>
                              <li>• Max 2 pending swap requests</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* SUPERVISOR PAGES */}
            {userRole === "supervisor" && (
              <>
                {activePage === "dashboard" && (
                  <>
                    {/* Header */}
                    <div className="mb-8">
                      <h1 className="text-3xl font-light mb-2">
                        <span
                          className="font-medium"
                          style={{ color: "#00523E" }}
                        >
                          Supervisor
                        </span>{" "}
                        Dashboard
                      </h1>
                      <p className="text-gray-600">
                        Manage your team and approve requests
                      </p>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <Users size={24} className="text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Team Size</p>
                            <p className="text-2xl font-bold">8</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <Clock size={24} className="text-green-600" />
                          <div>
                            <p className="text-sm text-gray-600">
                              Active Shifts
                            </p>
                            <p className="text-2xl font-bold">24</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <AlertCircle size={24} className="text-orange-600" />
                          <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold">
                              {
                                requests.filter((r) => r.status === "pending")
                                  .length
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <Calendar size={24} className="text-purple-600" />
                          <div>
                            <p className="text-sm text-gray-600">This Week</p>
                            <p className="text-2xl font-bold">168</p>
                            <p className="text-xs text-gray-500">hours</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Main Content - 2/3 width */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Pending Approvals */}
                        <div className="bg-white rounded-xl border border-gray-200">
                          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-medium">
                              Pending Approvals
                            </h2>
                            <button
                              onClick={() => setActivePage("approvals")}
                              className="text-sm hover:underline"
                              style={{ color: "#00523E" }}
                            >
                              View all →
                            </button>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {requests
                              .filter((r) => r.status === "pending")
                              .slice(0, 3)
                              .map((request) => (
                                <div
                                  key={request.id}
                                  className="p-6 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        {request.type === "time-off" && (
                                          <Calendar
                                            size={16}
                                            className="text-blue-600"
                                          />
                                        )}
                                        {request.type === "shift-swap" && (
                                          <Repeat
                                            size={16}
                                            className="text-purple-600"
                                          />
                                        )}
                                        {request.type === "availability" && (
                                          <Clock
                                            size={16}
                                            className="text-orange-600"
                                          />
                                        )}
                                        <h3 className="font-medium">
                                          {request.title}
                                        </h3>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-1">
                                        {request.workerName} •{" "}
                                        {request.dateRange}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Submitted {request.submittedDate}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleRequestAction(
                                          request.id,
                                          "approved",
                                          "Approved by supervisor",
                                        )
                                      }
                                      className="flex-1 flex items-center justify-center gap-2 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium hover:opacity-90"
                                      style={{ backgroundColor: "#00523E" }}
                                    >
                                      <CheckCircle size={16} />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        const reason = window.prompt(
                                          "Reason for denial (optional):",
                                        );
                                        handleRequestAction(
                                          request.id,
                                          "denied",
                                          reason || "Denied by supervisor",
                                        );
                                      }}
                                      className="flex-1 flex items-center justify-center gap-2 border border-red-300 text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                                    >
                                      <XCircle size={16} />
                                      Deny
                                    </button>
                                  </div>
                                </div>
                              ))}
                            {requests.filter((r) => r.status === "pending")
                              .length === 0 && (
                              <div className="p-12 text-center text-gray-500">
                                <CheckCircle
                                  size={48}
                                  className="mx-auto mb-3 text-gray-300"
                                />
                                <p>No pending approvals</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl border border-gray-200">
                          <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-medium">
                              Recent Activity
                            </h2>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {requests.slice(0, 5).map((request, idx) => (
                              <div
                                key={idx}
                                className="p-4 flex items-start gap-3"
                              >
                                <div className="mt-1">
                                  {request.status === "approved" && (
                                    <CheckCircle
                                      size={16}
                                      className="text-green-600"
                                    />
                                  )}
                                  {request.status === "denied" && (
                                    <XCircle
                                      size={16}
                                      className="text-red-600"
                                    />
                                  )}
                                  {request.status === "pending" && (
                                    <Clock
                                      size={16}
                                      className="text-orange-600"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900">
                                    <span className="font-medium">
                                      {request.workerName}
                                    </span>{" "}
                                    {request.type === "time-off" &&
                                      "requested time off"}
                                    {request.type === "shift-swap" &&
                                      "requested shift swap"}
                                    {request.type === "availability" &&
                                      "updated availability"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {request.submittedDate}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    request.status === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : request.status === "denied"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-orange-100 text-orange-800"
                                  }`}
                                >
                                  {request.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Sidebar - 1/3 width */}
                      <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">
                            Quick Actions
                          </h2>
                          <div className="space-y-3">
                            <button
                              onClick={() => setShowCreateShiftModal(true)}
                              className="w-full text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
                              style={{ backgroundColor: "#00523E" }}
                            >
                              <Plus size={18} />
                              Create Shift
                            </button>
                            <button
                              onClick={() => setActivePage("team")}
                              className="w-full border border-gray-200 px-4 py-3 rounded-lg hover:border-gray-300 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <Users size={18} />
                              Manage Team
                            </button>
                            <button
                              onClick={() => setActivePage("approvals")}
                              className="w-full border border-gray-200 px-4 py-3 rounded-lg hover:border-gray-300 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <Calendar size={18} />
                              Review Requests
                            </button>
                          </div>
                        </div>

                        {/* Team Summary */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">
                            Team Summary
                          </h2>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">
                                  Hours This Week
                                </span>
                                <span className="font-medium">168 / 200</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    width: "84%",
                                    backgroundColor: "#00523E",
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-gray-200 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Active Workers
                                </span>
                                <span className="font-medium">8</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  On Schedule
                                </span>
                                <span className="font-medium">7</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Time Off</span>
                                <span className="font-medium">1</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* APPROVALS PAGE */}
                {activePage === "approvals" && (
                  <>
                    <div className="mb-6">
                      <button
                        onClick={() => setActivePage("dashboard")}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                      >
                        <ChevronRight size={16} className="rotate-180" />
                        Back to Dashboard
                      </button>
                    </div>

                    <div className="mb-8">
                      <h1 className="text-3xl font-light mb-2">
                        <span
                          className="font-medium"
                          style={{ color: "#00523E" }}
                        >
                          Pending
                        </span>{" "}
                        Approvals
                      </h1>
                      <p className="text-gray-600">
                        Review and approve worker requests
                      </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200">
                      {requests.filter((r) => r.status === "pending").length ===
                      0 ? (
                        <div className="p-12 text-center text-gray-500">
                          <CheckCircle
                            size={64}
                            className="mx-auto mb-4 text-gray-300"
                          />
                          <p className="text-lg font-medium mb-2">
                            All caught up!
                          </p>
                          <p className="text-sm">
                            No pending requests to review
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {requests
                            .filter((r) => r.status === "pending")
                            .map((request) => (
                              <div key={request.id} className="p-6">
                                <div className="flex items-start gap-6">
                                  <div className="flex-shrink-0">
                                    {request.type === "time-off" && (
                                      <div className="p-3 rounded-lg bg-blue-100">
                                        <Calendar
                                          size={24}
                                          className="text-blue-600"
                                        />
                                      </div>
                                    )}
                                    {request.type === "shift-swap" && (
                                      <div className="p-3 rounded-lg bg-purple-100">
                                        <Repeat
                                          size={24}
                                          className="text-purple-600"
                                        />
                                      </div>
                                    )}
                                    {request.type === "availability" && (
                                      <div className="p-3 rounded-lg bg-orange-100">
                                        <Clock
                                          size={24}
                                          className="text-orange-600"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                      <div>
                                        <h3 className="text-lg font-medium mb-1">
                                          {request.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                          Requested by{" "}
                                          <span className="font-medium">
                                            {request.workerName}
                                          </span>
                                        </p>
                                      </div>
                                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        Pending
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                      <div>
                                        <p className="text-gray-500 mb-1">
                                          Date Range
                                        </p>
                                        <p className="font-medium">
                                          {request.dateRange}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 mb-1">
                                          Reason
                                        </p>
                                        <p className="font-medium">
                                          {request.reason}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 mb-1">
                                          Submitted
                                        </p>
                                        <p className="font-medium">
                                          {request.submittedDate}
                                        </p>
                                      </div>
                                      {request.affectedShifts && (
                                        <div>
                                          <p className="text-gray-500 mb-1">
                                            Affected Shifts
                                          </p>
                                          <p className="font-medium">
                                            {request.affectedShifts}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {request.type === "shift-swap" && (
                                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium mb-2">
                                          Swap Details
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                          <div>
                                            <p className="text-gray-500">
                                              Original Shift
                                            </p>
                                            <p className="font-medium">
                                              {request.originalShift}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-gray-500">
                                              Swap With
                                            </p>
                                            <p className="font-medium">
                                              {request.swapWith}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex gap-3">
                                      <button
                                        onClick={() =>
                                          handleRequestAction(
                                            request.id,
                                            "approved",
                                            "Approved by supervisor",
                                          )
                                        }
                                        className="flex items-center justify-center gap-2 text-white px-6 py-2.5 rounded-lg transition-colors font-medium hover:opacity-90"
                                        style={{ backgroundColor: "#00523E" }}
                                      >
                                        <CheckCircle size={18} />
                                        Approve Request
                                      </button>
                                      <button
                                        onClick={() => {
                                          const reason = window.prompt(
                                            "Reason for denial (optional):",
                                          );
                                          handleRequestAction(
                                            request.id,
                                            "denied",
                                            reason || "Denied by supervisor",
                                          );
                                        }}
                                        className="flex items-center justify-center gap-2 border-2 border-red-300 text-red-700 px-6 py-2.5 rounded-lg hover:bg-red-50 transition-colors font-medium"
                                      >
                                        <XCircle size={18} />
                                        Deny Request
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* TEAM MANAGEMENT PAGE */}
                {activePage === "team" && (
                  <>
                    <div className="mb-6">
                      <button
                        onClick={() => setActivePage("dashboard")}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                      >
                        <ChevronRight size={16} className="rotate-180" />
                        Back to Dashboard
                      </button>
                    </div>

                    <div className="mb-8">
                      <h1 className="text-3xl font-light mb-2">
                        <span
                          className="font-medium"
                          style={{ color: "#00523E" }}
                        >
                          Team
                        </span>{" "}
                        Management
                      </h1>
                      <p className="text-gray-600">
                        View and manage your team members
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamRoster.map((worker) => {
                        const workerShifts = upcomingShifts.filter(
                          (s) => s.workerName === worker.name,
                        );
                        const workerRequests = requests.filter(
                          (r) => r.workerName === worker.name,
                        );
                        const pendingRequests = workerRequests.filter(
                          (r) => r.status === "pending",
                        ).length;

                        return (
                          <div
                            key={worker.id}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg"
                                  style={{ backgroundColor: "#00523E" }}
                                >
                                  {worker.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {worker.name}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {worker.role}
                                  </p>
                                </div>
                              </div>
                              {pendingRequests > 0 && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                  {pendingRequests} pending
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Hourly Rate
                                </span>
                                <span className="font-medium">
                                  ${worker.rate}/hr
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Upcoming Shifts
                                </span>
                                <span className="font-medium">
                                  {workerShifts.length}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Total Requests
                                </span>
                                <span className="font-medium">
                                  {workerRequests.length}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedWorker(worker);
                                  setActivePage("worker-profile");
                                }}
                                className="flex-1 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium hover:opacity-90"
                                style={{ backgroundColor: "#00523E" }}
                              >
                                View Profile
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedWorker(worker);
                                  setShowFeedbackModal(true);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                              >
                                Feedback
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* WORKER PROFILE PAGE */}
                {activePage === "worker-profile" && selectedWorker && (
                  <>
                    <div className="mb-6">
                      <button
                        onClick={() => {
                          setActivePage("team");
                          setSelectedWorker(null);
                        }}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                      >
                        <ChevronRight size={16} className="rotate-180" />
                        Back to Team
                      </button>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-medium text-2xl"
                            style={{ backgroundColor: "#00523E" }}
                          >
                            {selectedWorker.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <h1 className="text-3xl font-light mb-1">
                              {selectedWorker.name}
                            </h1>
                            <p className="text-gray-600">
                              {selectedWorker.role} • ${selectedWorker.rate}/hr
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowFeedbackModal(true);
                          }}
                          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors font-medium hover:opacity-90"
                          style={{ backgroundColor: "#00523E" }}
                        >
                          <Plus size={18} />
                          Give Feedback
                        </button>
                      </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <Calendar size={24} className="text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">
                              Total Shifts
                            </p>
                            <p className="text-2xl font-bold">
                              {
                                upcomingShifts.filter(
                                  (s) => s.workerName === selectedWorker.name,
                                ).length
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <Clock size={24} className="text-green-600" />
                          <div>
                            <p className="text-sm text-gray-600">Total Hours</p>
                            <p className="text-2xl font-bold">
                              {upcomingShifts
                                .filter(
                                  (s) => s.workerName === selectedWorker.name,
                                )
                                .reduce((sum, s) => sum + (s.hours || 4), 0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <DollarSign size={24} className="text-purple-600" />
                          <div>
                            <p className="text-sm text-gray-600">
                              Est. Earnings
                            </p>
                            <p className="text-2xl font-bold">
                              $
                              {upcomingShifts
                                .filter(
                                  (s) => s.workerName === selectedWorker.name,
                                )
                                .reduce(
                                  (sum, s) =>
                                    sum + (s.hours || 4) * selectedWorker.rate,
                                  0,
                                )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <FileText size={24} className="text-orange-600" />
                          <div>
                            <p className="text-sm text-gray-600">Requests</p>
                            <p className="text-2xl font-bold">
                              {
                                requests.filter(
                                  (r) => r.workerName === selectedWorker.name,
                                ).length
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Main Content */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Upcoming Shifts */}
                        <div className="bg-white rounded-xl border border-gray-200">
                          <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-medium">
                              Upcoming Shifts
                            </h2>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {upcomingShifts
                              .filter(
                                (s) => s.workerName === selectedWorker.name,
                              )
                              .map((shift) => (
                                <div key={shift.id} className="p-6">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h3 className="font-medium mb-1">
                                        {shift.location}
                                      </h3>
                                      <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                          <Calendar size={14} />
                                          {shift.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Clock size={14} />
                                          {shift.time}
                                        </span>
                                      </div>
                                    </div>
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        shift.status === "confirmed"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-orange-100 text-orange-800"
                                      }`}
                                    >
                                      {shift.status}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-500">Duration</p>
                                      <p className="font-medium">
                                        {shift.duration}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Earnings</p>
                                      <p className="font-medium">
                                        $
                                        {(shift.hours || 4) *
                                          selectedWorker.rate}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            {upcomingShifts.filter(
                              (s) => s.workerName === selectedWorker.name,
                            ).length === 0 && (
                              <div className="p-12 text-center text-gray-500">
                                <Calendar
                                  size={48}
                                  className="mx-auto mb-3 text-gray-300"
                                />
                                <p>No upcoming shifts</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Request History */}
                        <div className="bg-white rounded-xl border border-gray-200">
                          <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-medium">
                              Request History
                            </h2>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {requests
                              .filter(
                                (r) => r.workerName === selectedWorker.name,
                              )
                              .map((request) => (
                                <div key={request.id} className="p-6">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        {request.type === "time-off" && (
                                          <Calendar
                                            size={16}
                                            className="text-blue-600"
                                          />
                                        )}
                                        {request.type === "shift-swap" && (
                                          <Repeat
                                            size={16}
                                            className="text-purple-600"
                                          />
                                        )}
                                        {request.type === "availability" && (
                                          <Clock
                                            size={16}
                                            className="text-orange-600"
                                          />
                                        )}
                                        <h3 className="font-medium">
                                          {request.title}
                                        </h3>
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        {request.dateRange}
                                      </p>
                                    </div>
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        request.status === "approved"
                                          ? "bg-green-100 text-green-800"
                                          : request.status === "denied"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-orange-100 text-orange-800"
                                      }`}
                                    >
                                      {request.status}
                                    </span>
                                  </div>
                                  {request.notes && (
                                    <p className="text-sm text-gray-600 mt-2">
                                      Note: {request.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            {requests.filter(
                              (r) => r.workerName === selectedWorker.name,
                            ).length === 0 && (
                              <div className="p-12 text-center text-gray-500">
                                <FileText
                                  size={48}
                                  className="mx-auto mb-3 text-gray-300"
                                />
                                <p>No requests</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sidebar */}
                      <div className="space-y-6">
                        {/* Contact Information */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">
                            Contact Information
                          </h2>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail size={16} className="text-gray-400" />
                              <span className="text-gray-600">
                                {selectedWorker.name
                                  .toLowerCase()
                                  .replace(" ", ".")}
                                @university.edu
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone size={16} className="text-gray-400" />
                              <span className="text-gray-600">
                                (555) {selectedWorker.id}00-{selectedWorker.id}
                                234
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Performance Summary */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">
                            Performance Summary
                          </h2>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">
                                  Attendance Rate
                                </span>
                                <span className="font-medium">98%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-green-600"
                                  style={{ width: "98%" }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">
                                  On-Time Rate
                                </span>
                                <span className="font-medium">95%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-green-600"
                                  style={{ width: "95%" }}
                                ></div>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-gray-200">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Overall Rating
                                </span>
                                <span className="font-medium text-lg">
                                  4.8/5.0
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                          <h2 className="text-lg font-medium mb-4">
                            Quick Actions
                          </h2>
                          <div className="space-y-2">
                            <button
                              onClick={() => {
                                setShowCreateShiftModal(true);
                              }}
                              className="w-full text-left px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              Assign New Shift
                            </button>
                            <button
                              onClick={() => {
                                setShowFeedbackModal(true);
                              }}
                              className="w-full text-left px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              Give Feedback
                            </button>
                            <button
                              onClick={() => {
                                alert("Message functionality would open here");
                              }}
                              className="w-full text-left px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              Send Message
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* SHIFT DETAILS MODAL */}
      {selectedShift && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedShift(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={20} className="text-gray-400" />
                    <h2 className="text-2xl font-light">
                      <span
                        className="font-medium"
                        style={{ color: "#00523E" }}
                      >
                        {selectedShift.location}
                      </span>
                    </h2>
                  </div>
                  <p className="text-gray-600">
                    {selectedShift.date} • {selectedShift.time}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedShift(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedShift.status === "confirmed"
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {selectedShift.status === "confirmed" ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle size={16} />
                      Confirmed
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Clock size={16} />
                      Pending
                    </span>
                  )}
                </span>
                <span className="text-sm text-gray-600">
                  Duration: {selectedShift.duration}
                </span>
              </div>

              {/* Shift Details */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Shift Details
                </h3>

                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Time</p>
                    <p className="text-sm text-gray-600">
                      {selectedShift.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Location
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedShift.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Supervisor Contact */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <h3 className="font-medium text-gray-900 mb-3">Supervisor</h3>

                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    {selectedShift.supervisor}
                  </p>

                  <a
                    href={`tel:${selectedShift.supervisorPhone}`}
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Phone size={16} className="text-gray-400" />
                    {selectedShift.supervisorPhone}
                  </a>

                  <a
                    href={`mailto:${selectedShift.supervisorEmail}`}
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Mail size={16} className="text-gray-400" />
                    {selectedShift.supervisorEmail}
                  </a>
                </div>
              </div>

              {/* Instructions */}
              {selectedShift.instructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <FileText size={18} className="text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900 mb-2">
                        Instructions
                      </h3>
                      <p className="text-sm text-blue-800">
                        {selectedShift.instructions}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Check In/Out Buttons */}
              <div className="space-y-3">
                {selectedShift.date === "Today" && (
                  <>
                    {!selectedShift.checkInTime ? (
                      <button
                        onClick={() => {
                          alert(
                            "Checked in at " + new Date().toLocaleTimeString(),
                          );
                          setSelectedShift(null);
                        }}
                        className="w-full flex items-center justify-center gap-2 text-white px-6 py-4 rounded-lg transition-colors font-medium hover:opacity-90"
                        style={{ backgroundColor: "#00523E" }}
                      >
                        <LogIn size={20} />
                        Check In to Shift
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          alert(
                            "Checked out at " + new Date().toLocaleTimeString(),
                          );
                          setSelectedShift(null);
                        }}
                        className="w-full flex items-center justify-center gap-2 text-white px-6 py-4 rounded-lg transition-colors font-medium hover:opacity-90"
                        style={{ backgroundColor: "#00523E" }}
                      >
                        <LogOut size={20} />
                        Check Out of Shift
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => {
                    if (window.confirm("Report an issue with this shift?")) {
                      alert("Issue report functionality would open here");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  <AlertTriangle size={18} />
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAY STUB DETAILS MODAL */}
      {selectedPayStub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Pay Stub Details
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPayStub.period}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayStub(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={18} className="text-green-700" />
                    <p className="text-sm text-green-700 font-medium">
                      Gross Pay
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    ${selectedPayStub.gross.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {selectedPayStub.hours} hours worked
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={18} className="text-blue-700" />
                    <p className="text-sm text-blue-700 font-medium">
                      Deductions
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    ${(selectedPayStub.gross - selectedPayStub.net).toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {(
                      ((selectedPayStub.gross - selectedPayStub.net) /
                        selectedPayStub.gross) *
                      100
                    ).toFixed(1)}
                    % of gross
                  </p>
                </div>

                <div
                  className="rounded-xl p-4 border-2"
                  style={{
                    backgroundColor: "#00523E",
                    borderColor: "#003d2e",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={18} className="text-green-200" />
                    <p className="text-sm text-green-200 font-medium">
                      Net Pay
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ${selectedPayStub.net.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-200 mt-1">
                    Paid on {selectedPayStub.date}
                  </p>
                </div>
              </div>

              {/* Daily Hours Breakdown */}
              {selectedPayStub.dailyHours && (
                <div className="bg-white border border-gray-200 rounded-xl mb-6">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <Clock size={16} />
                      Daily Hours Breakdown
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                            Location
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">
                            Hours
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">
                            Rate
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedPayStub.dailyHours.map((day, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">
                              {day.date}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {day.location}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900">
                              {day.hours}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              ${day.rate.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                              ${(day.hours * day.rate).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                        <tr>
                          <td
                            colSpan="2"
                            className="px-4 py-3 font-medium text-gray-900"
                          >
                            Total
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {selectedPayStub.hours}
                          </td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            ${selectedPayStub.gross.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Deductions Breakdown */}
              {selectedPayStub.deductions && (
                <div className="bg-white border border-gray-200 rounded-xl mb-6">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <FileText size={16} />
                      Deductions
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">
                        Federal Income Tax
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ${selectedPayStub.deductions.federalTax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">
                        State Income Tax
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ${selectedPayStub.deductions.stateTax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">
                        FICA (Social Security & Medicare)
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ${selectedPayStub.deductions.fica.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 pt-3 border-t-2 border-gray-300">
                      <span className="text-sm font-medium text-gray-900">
                        Total Deductions
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        $
                        {(
                          selectedPayStub.deductions.federalTax +
                          selectedPayStub.deductions.stateTax +
                          selectedPayStub.deductions.fica
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Year-to-Date Summary */}
              {selectedPayStub.ytd && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl mb-6">
                  <div className="px-4 py-3 border-b border-green-200 bg-white bg-opacity-60 rounded-t-xl">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <Calendar size={16} />
                      Year-to-Date Totals (2026)
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Gross Pay</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${selectedPayStub.ytd.grossPay.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Net Pay</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${selectedPayStub.ytd.netPay.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">
                          Federal Tax
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          ${selectedPayStub.ytd.federalTax.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">State Tax</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${selectedPayStub.ytd.stateTax.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">FICA</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${selectedPayStub.ytd.fica.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">
                          Total Deductions
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          $
                          {(
                            selectedPayStub.ytd.federalTax +
                            selectedPayStub.ytd.stateTax +
                            selectedPayStub.ytd.fica
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Pay Calculation */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">
                  Net Pay Calculation
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Pay</span>
                    <span className="font-medium text-gray-900">
                      ${selectedPayStub.gross.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>- Total Deductions</span>
                    <span className="font-medium">
                      $
                      {(selectedPayStub.gross - selectedPayStub.net).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-gray-300 text-base font-bold">
                    <span className="text-gray-900">Net Pay</span>
                    <span style={{ color: "#00523E" }}>
                      ${selectedPayStub.net.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    alert("Download functionality would trigger PDF download")
                  }
                  className="flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg transition-colors font-medium hover:opacity-90"
                  style={{ backgroundColor: "#00523E" }}
                >
                  <Download size={18} />
                  Download PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 border-2 border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  <Printer size={18} />
                  Print Pay Stub
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle
                    size={16}
                    className="text-blue-700 mt-0.5 flex-shrink-0"
                  />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">
                      Need help understanding your pay stub?
                    </p>
                    <p>
                      Contact HR at hr@university.edu or visit the Payroll
                      Office in Admin Building, Room 201.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SHIFT MODAL */}
      {showCreateShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Create New Shift
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Assign a shift to a team member
                </p>
              </div>
              <button
                onClick={() => setShowCreateShiftModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const worker = teamRoster.find(
                  (w) => w.id === parseInt(formData.get("worker")),
                );

                const shiftData = {
                  workerName: worker.name,
                  location: formData.get("location"),
                  date: formData.get("date"),
                  time: formData.get("time"),
                  duration: formData.get("duration"),
                  hours: parseFloat(formData.get("hours")),
                  rate: worker.rate,
                  supervisor: formData.get("supervisor"),
                  supervisorPhone: formData.get("supervisorPhone"),
                  supervisorEmail: formData.get("supervisorEmail"),
                  address: formData.get("address"),
                  instructions: formData.get("instructions"),
                };

                handleCreateShift(shiftData);
              }}
              className="p-6"
            >
              <div className="space-y-5">
                {/* Select Worker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Worker *
                  </label>
                  <select
                    name="worker"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                  >
                    <option value="">Select a worker</option>
                    {teamRoster.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} - ${worker.rate}/hr
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <select
                    name="location"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                  >
                    <option value="">Select location</option>
                    <option value="Student Center - Front Desk">
                      Student Center - Front Desk
                    </option>
                    <option value="Library - Reference Desk">
                      Library - Reference Desk
                    </option>
                    <option value="Library - Circulation Desk">
                      Library - Circulation Desk
                    </option>
                    <option value="Admin Office - Reception">
                      Admin Office - Reception
                    </option>
                    <option value="Cafeteria - Service Counter">
                      Cafeteria - Service Counter
                    </option>
                    <option value="Gym - Equipment Room">
                      Gym - Equipment Room
                    </option>
                  </select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time *
                    </label>
                    <input
                      type="text"
                      name="time"
                      placeholder="e.g., 2:00 PM - 6:00 PM"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Duration and Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration *
                    </label>
                    <input
                      type="text"
                      name="duration"
                      placeholder="e.g., 4 hrs"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hours (for pay calculation) *
                    </label>
                    <input
                      type="number"
                      name="hours"
                      step="0.5"
                      min="0.5"
                      max="12"
                      placeholder="4"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Supervisor Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor Name *
                  </label>
                  <input
                    type="text"
                    name="supervisor"
                    placeholder="e.g., Sarah Johnson"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supervisor Phone *
                    </label>
                    <input
                      type="tel"
                      name="supervisorPhone"
                      placeholder="(555) 123-4567"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supervisor Email *
                    </label>
                    <input
                      type="email"
                      name="supervisorEmail"
                      placeholder="supervisor@university.edu"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="123 Campus Drive, Building Name"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    name="instructions"
                    rows={3}
                    placeholder="Any special instructions for the worker..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent resize-none"
                  />
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      size={16}
                      className="text-blue-700 mt-0.5 flex-shrink-0"
                    />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Shift Creation</p>
                      <p>
                        The worker will see this shift in their upcoming
                        schedule immediately. They will receive a notification
                        about the new assignment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg transition-colors font-medium hover:opacity-90"
                  style={{ backgroundColor: "#00523E" }}
                >
                  <Plus size={18} />
                  Create Shift
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateShiftModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GIVE FEEDBACK MODAL */}
      {showFeedbackModal && selectedWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Give Performance Feedback
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  For {selectedWorker.name}
                </p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);

                const feedbackData = {
                  workerName: selectedWorker.name,
                  rating: parseInt(formData.get("rating")),
                  category: formData.get("category"),
                  comments: formData.get("comments"),
                };

                handleCreateFeedback(feedbackData);
              }}
              className="p-6"
            >
              <div className="space-y-5">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Overall Rating *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <label
                        key={rating}
                        className="flex items-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-green-700 cursor-pointer transition-all has-[:checked]:border-green-700 has-[:checked]:bg-green-50"
                      >
                        <input
                          type="radio"
                          name="rating"
                          value={rating}
                          required
                          className="sr-only"
                        />
                        <div className="flex items-center gap-1">
                          {[...Array(rating)].map((_, i) => (
                            <Star
                              key={i}
                              size={18}
                              className="fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                        <span className="font-medium text-sm">{rating}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Category *
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    <option value="Communication">Communication</option>
                    <option value="Punctuality">Punctuality</option>
                    <option value="Quality of Work">Quality of Work</option>
                    <option value="Teamwork">Teamwork</option>
                    <option value="Professionalism">Professionalism</option>
                    <option value="Initiative">Initiative</option>
                    <option value="Problem Solving">Problem Solving</option>
                    <option value="Customer Service">Customer Service</option>
                    <option value="General Performance">
                      General Performance
                    </option>
                  </select>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments *
                  </label>
                  <textarea
                    name="comments"
                    rows={5}
                    required
                    placeholder="Provide specific feedback about performance..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent resize-none"
                  />
                </div>

                {/* Recent Feedback */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Recent Feedback for {selectedWorker.name}
                  </h3>
                  <div className="space-y-2">
                    {feedbackList
                      .filter((f) => f.workerName === selectedWorker.name)
                      .slice(0, 3)
                      .map((feedback) => (
                        <div
                          key={feedback.id}
                          className="flex items-start gap-3 text-sm"
                        >
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < feedback.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }
                              />
                            ))}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {feedback.category}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {feedback.date} • {feedback.supervisorName}
                            </p>
                          </div>
                        </div>
                      ))}
                    {feedbackList.filter(
                      (f) => f.workerName === selectedWorker.name,
                    ).length === 0 && (
                      <p className="text-sm text-gray-500">
                        No previous feedback
                      </p>
                    )}
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      size={16}
                      className="text-blue-700 mt-0.5 flex-shrink-0"
                    />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Performance Feedback</p>
                      <p>
                        This feedback will be visible to the worker in their
                        performance section. Be constructive and specific to
                        help them improve.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg transition-colors font-medium hover:opacity-90"
                  style={{ backgroundColor: "#00523E" }}
                >
                  <CheckCircle size={18} />
                  Submit Feedback
                </button>
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
