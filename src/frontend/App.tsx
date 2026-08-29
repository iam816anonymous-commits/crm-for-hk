import React, { useState } from 'react';
import { NavLink, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, ShieldCheck, Home, ClipboardList,
  Target, MessageSquare, Phone, MessageCircle, Calendar, Clock,
  GitCompare, BarChart3, Settings, Search, Bell, Plus, LogOut
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext.js';
import LoginView from './views/LoginView.js';
import DashboardView from './views/DashboardView.js';
import ContactsView from './views/ContactsView.js';
import ContactDetailView from './views/ContactDetailView.js';
import PropertiesView from './views/PropertiesView.js';
import RequirementsView from './views/RequirementsView.js';
import LeadsView from './views/LeadsView.js';
import MatchesView from './views/MatchesView.js';
import { CallsView, WhatsAppView, VisitsView, FollowupsView } from './views/CommunicationViews.js';
import GenericView from './views/GenericView.js';

function ProtectedLayout() {
  const { user, loading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium text-slate-300">Loading PropCRM...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/contacts?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Contacts', path: '/contacts', icon: Users },
    { name: 'Customers', path: '/customers', icon: UserCheck },
    { name: 'Owners', path: '/owners', icon: ShieldCheck },
    { name: 'Properties', path: '/properties', icon: Home },
    { name: 'Requirements', path: '/requirements', icon: ClipboardList },
    { name: 'Leads', path: '/leads', icon: Target },
    { name: 'Interactions', path: '/interactions', icon: MessageSquare },
    { name: 'Calls', path: '/calls', icon: Phone },
    { name: 'WhatsApp', path: '/whatsapp', icon: MessageCircle },
    { name: 'Visits', path: '/visits', icon: Calendar },
    { name: 'Follow-ups', path: '/followups', icon: Clock },
    { name: 'Matches', path: '/matches', icon: GitCompare },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const userInitials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  return (
    <div className="flex h-screen bg-gray-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide leading-none text-white">PropCRM</h1>
            <span className="text-xs text-slate-400">{user.organizationName || 'Intelligence System'}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center font-bold text-white justify-center text-sm flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{user.role} • {user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 shadow-sm">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search phone (+91XXXXXXXXXX) or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
          </form>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/leads')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>
          </div>
        </header>

        {/* View Router */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/contacts" element={<ContactsView />} />
            <Route path="/contacts/:id" element={<ContactDetailView />} />
            <Route path="/customers" element={<GenericView title="Customers" icon={UserCheck} />} />
            <Route path="/owners" element={<GenericView title="Owners" icon={ShieldCheck} />} />
            <Route path="/properties" element={<PropertiesView />} />
            <Route path="/requirements" element={<RequirementsView />} />
            <Route path="/leads" element={<LeadsView />} />
            <Route path="/interactions" element={<GenericView title="Interactions" icon={MessageSquare} />} />
            <Route path="/calls" element={<CallsView />} />
            <Route path="/whatsapp" element={<WhatsAppView />} />
            <Route path="/visits" element={<VisitsView />} />
            <Route path="/followups" element={<FollowupsView />} />
            <Route path="/matches" element={<MatchesView />} />
            <Route path="/reports" element={<GenericView title="Reports" icon={BarChart3} />} />
            <Route path="/settings" element={<GenericView title="Settings" icon={Settings} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  );
}
