import React, { useState } from 'react';
import { Calendar, Clock, DollarSign, Bell, ChevronRight, Menu, X, MapPin, AlertCircle } from 'lucide-react';

export default function CampusJobERPMVP() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleLogin = (role) => {
    setUserRole(role);
    setIsLoggedIn(true);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setActivePage('dashboard');
  };

  const upcomingShifts = [
    {
      id: 1,
      location: 'Student Center - Front Desk',
      date: 'Today',
      time: '2:00 PM - 6:00 PM',
      duration: '4 hrs',
      supervisor: 'Sarah Johnson',
      status: 'confirmed'
    },
    {
      id: 2,
      location: 'Library - Reference Desk',
      date: 'Tomorrow',
      time: '10:00 AM - 2:00 PM',
      duration: '4 hrs',
      supervisor: 'Mike Chen',
      status: 'confirmed'
    },
    {
      id: 3,
      location: 'Student Center - Front Desk',
      date: 'Thu, Feb 13',
      time: '2:00 PM - 6:00 PM',
      duration: '4 hrs',
      supervisor: 'Sarah Johnson',
      status: 'pending'
    }
  ];

  const weekSchedule = [
    { day: 'Mon', date: '10', shifts: 1, hours: 4 },
    { day: 'Tue', date: '11', shifts: 1, hours: 4 },
    { day: 'Wed', date: '12', shifts: 0, hours: 0 },
    { day: 'Thu', date: '13', shifts: 1, hours: 4 },
    { day: 'Fri', date: '14', shifts: 2, hours: 6 },
    { day: 'Sat', date: '15', shifts: 0, hours: 0 },
    { day: 'Sun', date: '16', shifts: 1, hours: 3 }
  ];

  const recentActivity = [
    { type: 'shift', message: 'Shift completed at Student Center', time: '2 hours ago' },
    { type: 'approval', message: 'Time off request approved', time: '1 day ago' },
    { type: 'feedback', message: 'New feedback from Sarah Johnson', time: '2 days ago' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* LOGIN PAGE */}
      {!isLoggedIn ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Logo */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-light mb-2">
                Campus<span className="font-medium" style={{ color: '#00523E' }}>ERP</span>
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
                  onClick={() => handleLogin('worker')}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium mb-1">Student Worker</h3>
                      <p className="text-sm text-gray-600">View your shifts, schedule, and payroll</p>
                    </div>
                    <ChevronRight size={24} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </button>

                {/* Supervisor Login */}
                <button
                  onClick={() => handleLogin('supervisor')}
                  className="w-full p-6 border-2 rounded-xl transition-all text-left group hover:opacity-90"
                  style={{ borderColor: '#00523E', backgroundColor: '#00523E' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium mb-1 text-white">Supervisor</h3>
                      <p className="text-sm text-gray-200">Manage your team and approvals</p>
                    </div>
                    <ChevronRight size={24} className="text-gray-300 group-hover:text-white transition-colors" />
                  </div>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  Need help? <a href="#" className="hover:underline" style={{ color: '#00523E' }}>Contact Support</a>
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
              <div className="text-xl font-light tracking-tight">Campus<span className="font-medium" style={{ color: '#00523E' }}>ERP</span></div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-6">
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActivePage('dashboard'); }}
                  className={`text-sm font-medium ${activePage === 'dashboard' ? '' : 'text-gray-600 hover:text-gray-900'}`}
                  style={activePage === 'dashboard' ? { color: '#00523E' } : {}}
                >
                  Dashboard
                </a>
                {userRole === 'worker' && (
                  <>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActivePage('schedule'); }}
                      className={`text-sm ${activePage === 'schedule' ? 'font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                      style={activePage === 'schedule' ? { color: '#00523E' } : {}}
                    >
                      Schedule
                    </a>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActivePage('payroll'); }}
                      className={`text-sm ${activePage === 'payroll' ? 'font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                      style={activePage === 'payroll' ? { color: '#00523E' } : {}}
                    >
                      Payroll
                    </a>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActivePage('requests'); }}
                      className={`text-sm ${activePage === 'requests' ? 'font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                      style={activePage === 'requests' ? { color: '#00523E' } : {}}
                    >
                      Requests
                    </a>
                  </>
                )}
                {userRole === 'supervisor' && (
                  <>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActivePage('team'); }}
                      className={`text-sm ${activePage === 'team' ? 'font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                      style={activePage === 'team' ? { color: '#00523E' } : {}}
                    >
                      Team
                    </a>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActivePage('schedule'); }}
                      className={`text-sm ${activePage === 'schedule' ? 'font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                      style={activePage === 'schedule' ? { color: '#00523E' } : {}}
                    >
                      Schedule
                    </a>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActivePage('approvals'); }}
                      className={`text-sm ${activePage === 'approvals' ? 'font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                      style={activePage === 'approvals' ? { color: '#00523E' } : {}}
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
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#00523E' }}></span>
              </button>
              
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 p-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm" style={{ backgroundColor: '#00523E' }}>
                    {userRole === 'worker' ? 'JD' : 'SJ'}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{userRole === 'worker' ? 'Jordan Davis' : 'Sarah Johnson'}</p>
                    <p className="text-xs text-gray-500 capitalize">{userRole}</p>
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
                  onClick={(e) => { e.preventDefault(); setActivePage('dashboard'); setMobileMenuOpen(false); }}
                  className={`text-sm font-medium ${activePage === 'dashboard' ? '' : 'text-gray-600'}`}
                  style={activePage === 'dashboard' ? { color: '#00523E' } : {}}
                >
                  Dashboard
                </a>
                {userRole === 'worker' && (
                  <>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActivePage('schedule'); setMobileMenuOpen(false); }}
                      className={`text-sm ${activePage === 'schedule' ? 'font-medium' : 'text-gray-600'}`}
                      style={activePage === 'schedule' ? { color: '#00523E' } : {}}
                    >
                      Schedule
                    </a>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActivePage('payroll'); setMobileMenuOpen(false); }}
                      className={`text-sm ${activePage === 'payroll' ? 'font-medium' : 'text-gray-600'}`}
                      style={activePage === 'payroll' ? { color: '#00523E' } : {}}
                    >
                      Payroll
                    </a>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActivePage('requests'); setMobileMenuOpen(false); }}
                      className={`text-sm ${activePage === 'requests' ? 'font-medium' : 'text-gray-600'}`}
                      style={activePage === 'requests' ? { color: '#00523E' } : {}}
                    >
                      Requests
                    </a>
                  </>
                )}
                {userRole === 'supervisor' && (
                  <>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActivePage('team'); setMobileMenuOpen(false); }}
                      className={`text-sm ${activePage === 'team' ? 'font-medium' : 'text-gray-600'}`}
                      style={activePage === 'team' ? { color: '#00523E' } : {}}
                    >
                      Team
                    </a>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActivePage('schedule'); setMobileMenuOpen(false); }}
                      className={`text-sm ${activePage === 'schedule' ? 'font-medium' : 'text-gray-600'}`}
                      style={activePage === 'schedule' ? { color: '#00523E' } : {}}
                    >
                      Schedule
                    </a>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); setActivePage('approvals'); setMobileMenuOpen(false); }}
                      className={`text-sm ${activePage === 'approvals' ? 'font-medium' : 'text-gray-600'}`}
                      style={activePage === 'approvals' ? { color: '#00523E' } : {}}
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
        {userRole === 'worker' && (
          <>
        {/* DASHBOARD PAGE */}
        {activePage === 'dashboard' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-light mb-2">
                Welcome back, <span className="font-medium" style={{ color: '#00523E' }}>Jordan</span>
              </h1>
              <p className="text-gray-600">Here's what's happening with your campus job today.</p>
            </div>

            {/* Stats Overview */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
              <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center">
                <Clock size={24} className="text-gray-400 mb-3" />
                <div className="text-sm text-gray-600 mb-2">This Week</div>
                <div className="text-3xl font-light mb-1">21<span className="text-lg text-gray-600"> hrs</span></div>
                <div className="text-xs text-green-600">+3 from last week</div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center">
                <DollarSign size={24} className="text-gray-400 mb-3" />
                <div className="text-sm text-gray-600 mb-2">Est. Earnings</div>
                <div className="text-3xl font-light mb-1">$336</div>
                <div className="text-xs text-gray-500">at $16.00/hr</div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center">
                <Calendar size={24} className="text-gray-400 mb-3" />
                <div className="text-sm text-gray-600 mb-2">This Month</div>
                <div className="text-3xl font-light mb-1">68<span className="text-lg text-gray-600"> hrs</span></div>
                <div className="text-xs text-gray-500">Feb 1 - Feb 9</div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center">
                <AlertCircle size={24} className="text-gray-400 mb-3" />
                <div className="text-sm text-gray-600 mb-2">Next Shift</div>
                <div className="text-3xl font-light mb-1">Today</div>
                <div className="text-xs text-gray-500">in 4 hours</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Overview Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-medium mb-4">Quick Overview</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Next Shift</p>
                        <p className="font-medium">Today at 2:00 PM</p>
                      </div>
                      <button 
                        onClick={() => setActivePage('schedule')}
                        className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300"
                      >
                        View Schedule
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Upcoming Paycheck</p>
                        <p className="font-medium">$672 on Feb 15</p>
                      </div>
                      <button 
                        onClick={() => setActivePage('payroll')}
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
                  <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button className="w-full text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium hover:opacity-90" style={{ backgroundColor: '#00523E' }}>
                      Request Time Off
                    </button>
                    <button className="w-full border border-gray-200 px-4 py-3 rounded-lg hover:border-gray-300 transition-colors text-sm font-medium">
                      Swap Shift
                    </button>
                    <button className="w-full border border-gray-200 px-4 py-3 rounded-lg hover:border-gray-300 transition-colors text-sm font-medium">
                      Update Availability
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#00523E' }}></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="text-white rounded-xl p-6" style={{ backgroundColor: '#00523E' }}>
                  <h2 className="text-lg font-medium mb-4">Performance</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-200">Punctuality</span>
                        <span className="text-sm font-medium">98%</span>
                      </div>
                      <div className="w-full bg-green-900 bg-opacity-30 rounded-full h-2">
                        <div className="bg-green-300 h-2 rounded-full" style={{ width: '98%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-200">Attendance</span>
                        <span className="text-sm font-medium">95%</span>
                      </div>
                      <div className="w-full bg-blue-900 bg-opacity-30 rounded-full h-2">
                        <div className="bg-blue-300 h-2 rounded-full" style={{ width: '95%' }}></div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-green-800 border-opacity-30">
                      <p className="text-sm text-gray-200">Latest feedback from Sarah Johnson</p>
                      <p className="text-xs text-gray-300 mt-2">"Great job handling the busy afternoon rush!"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SCHEDULE PAGE */}
        {activePage === 'schedule' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-light mb-2">
                <span className="font-medium" style={{ color: '#00523E' }}>Schedule</span>
              </h1>
              <p className="text-gray-600">Manage your shifts and availability.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Upcoming Shifts */}
                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium">Upcoming Shifts</h2>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                        View all
                        <ChevronRight size={16} />
                      </a>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {upcomingShifts.map((shift) => (
                      <div key={shift.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin size={16} className="text-gray-400" />
                              <h3 className="font-medium">{shift.location}</h3>
                            </div>
                            <p className="text-sm text-gray-600">{shift.date} • {shift.time}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            shift.status === 'confirmed' 
                              ? 'bg-green-50 text-green-700' 
                              : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            {shift.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{shift.duration}</span>
                          <span>•</span>
                          <span>Supervisor: {shift.supervisor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Schedule Overview */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-medium mb-6">This Week</h2>
                  <div className="grid grid-cols-7 gap-2">
                    {weekSchedule.map((day) => (
                      <div 
                        key={day.day}
                        className={`text-center p-3 rounded-lg ${
                          day.shifts > 0 ? 'text-white' : 'bg-gray-50 text-gray-400'
                        }`}
                        style={day.shifts > 0 ? { backgroundColor: '#00523E' } : {}}
                      >
                        <div className="text-xs mb-1">{day.day}</div>
                        <div className="text-lg font-medium mb-1">{day.date}</div>
                        <div className="text-xs">{day.hours > 0 ? `${day.hours}h` : '—'}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total this week</span>
                    <span className="font-medium">21 hours</span>
                  </div>
                </div>
              </div>

              {/* Right Column - 1/3 width */}
              <div className="space-y-6">
                {/* Availability */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-medium mb-4">My Availability</h2>
                  <div className="space-y-3">
                    <button className="w-full text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium hover:opacity-90" style={{ backgroundColor: '#00523E' }}>
                      Update Availability
                    </button>
                    <button className="w-full border border-gray-200 px-4 py-3 rounded-lg hover:border-gray-300 transition-colors text-sm font-medium">
                      Request Shift Swap
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Current availability:</p>
                    <p className="text-xs text-gray-500">Mon-Fri: 2pm-6pm<br/>Sat-Sun: Not available</p>
                  </div>
                </div>

                {/* Calendar View */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-medium mb-4">February 2026</h2>
                  <div className="text-sm text-gray-600">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-xs font-medium text-gray-400">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <div 
                          key={day} 
                          className={`text-center p-2 text-xs rounded ${
                            [10, 11, 13, 14, 16].includes(day) 
                              ? 'text-white font-medium' 
                              : 'text-gray-600'
                          }`}
                          style={[10, 11, 13, 14, 16].includes(day) ? { backgroundColor: '#00523E' } : {}}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* PAYROLL PAGE */}
        {activePage === 'payroll' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-light mb-2">
                <span className="font-medium" style={{ color: '#00523E' }}>Payroll</span>
              </h1>
              <p className="text-gray-600">View your earnings and payment history.</p>
            </div>

            {/* Earnings Overview */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
              <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center">
                <Clock size={24} className="text-gray-400 mb-3" />
                <div className="text-sm text-gray-600 mb-2">Current Period</div>
                <div className="text-3xl font-light mb-1">21<span className="text-lg text-gray-600"> hrs</span></div>
                <div className="text-xs text-gray-500">Feb 1 - Feb 15</div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center">
                <DollarSign size={24} className="text-gray-400 mb-3" />
                <div className="text-sm text-gray-600 mb-2">Projected Earnings</div>
                <div className="text-3xl font-light mb-1">$336</div>
                <div className="text-xs text-gray-500">at $16.00/hr</div>
              </div>

              <div className="rounded-xl p-6 min-w-[180px] w-[180px] h-[180px] flex-shrink-0 flex flex-col items-center justify-center text-center" style={{ backgroundColor: '#00523E' }}>
                <Calendar size={24} className="text-gray-300 mb-3" />
                <div className="text-sm text-gray-200 mb-2">Next Paycheck</div>
                <div className="text-3xl font-light mb-1 text-white">$336</div>
                <div className="text-xs text-gray-300">Due Feb 15, 2026</div>
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
                      { period: 'Jan 16 - Jan 31, 2026', hours: 42, gross: 672, net: 588, date: 'Feb 1, 2026', status: 'Paid' },
                      { period: 'Jan 1 - Jan 15, 2026', hours: 38, gross: 608, net: 532, date: 'Jan 16, 2026', status: 'Paid' },
                      { period: 'Dec 16 - Dec 31, 2025', hours: 35, gross: 560, net: 490, date: 'Jan 2, 2026', status: 'Paid' },
                      { period: 'Dec 1 - Dec 15, 2025', hours: 40, gross: 640, net: 560, date: 'Dec 16, 2025', status: 'Paid' },
                      { period: 'Nov 16 - Nov 30, 2025', hours: 36, gross: 576, net: 504, date: 'Dec 1, 2025', status: 'Paid' }
                    ].map((stub, index) => (
                      <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium mb-1">{stub.period}</h3>
                            <p className="text-sm text-gray-600">{stub.hours} hours worked</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            {stub.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 mb-1">Gross Pay</p>
                            <p className="font-medium">${stub.gross.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">Net Pay</p>
                            <p className="font-medium">${stub.net.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">Pay Date</p>
                            <p className="font-medium">{stub.date}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <button className="text-sm hover:underline" style={{ color: '#00523E' }}>
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
                  <h2 className="text-lg font-medium mb-4">Current Pay Period</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Period</span>
                      <span className="text-sm font-medium">Feb 1 - Feb 15</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Hours Logged</span>
                      <span className="text-sm font-medium">21 hrs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Hourly Rate</span>
                      <span className="text-sm font-medium">$16.00</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Projected Gross</span>
                        <span className="text-lg font-medium" style={{ color: '#00523E' }}>$336.00</span>
                      </div>
                      <p className="text-xs text-gray-500">Estimated net: ~$294.00</p>
                    </div>
                  </div>
                </div>

                {/* Year to Date */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-medium mb-4">2026 Year to Date</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Hours</span>
                      <span className="text-sm font-medium">101 hrs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Gross Earnings</span>
                      <span className="text-sm font-medium">$1,616.00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Net Earnings</span>
                      <span className="text-sm font-medium">$1,414.00</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-medium mb-4">Actions</h2>
                  <div className="space-y-3">
                    <button className="w-full text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium hover:opacity-90" style={{ backgroundColor: '#00523E' }}>
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
        {activePage === 'requests' && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-light mb-4">Requests</h2>
            <p className="text-gray-600">Requests page coming soon...</p>
          </div>
        )}
          </>
        )}

        {/* SUPERVISOR PAGES - Placeholder for now */}
        {userRole === 'supervisor' && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-light mb-4">Supervisor Dashboard</h2>
            <p className="text-gray-600">Supervisor pages coming soon...</p>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
