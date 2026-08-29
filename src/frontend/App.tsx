import React, { useState } from 'react';
import { NavLink, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, ShieldCheck, Home, ClipboardList,
  Target, MessageSquare, Phone, MessageCircle, Calendar, Clock,
  GitCompare, Settings, Search, Bell, LogOut, Shield, ChevronDown
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
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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

  // Grouped Navigation Sections
  const navSections = [
    {
      title: 'WORKSPACE',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      ],
    },
    {
      title: 'CRM & LEADS',
      items: [
        { name: 'Contacts', path: '/contacts', icon: Users },
        { name: 'Lead Pipeline', path: '/leads', icon: Target },
        { name: 'Follow-ups', path: '/followups', icon: Clock },
      ],
    },
    {
      title: 'PROPERTIES & MATCHING',
      items: [
        { name: 'Properties', path: '/properties', icon: Home },
        { name: 'Requirements', path: '/requirements', icon: ClipboardList },
        { name: 'Property Matches', path: '/matches', icon: GitCompare },
        { name: 'Site Visits', path: '/visits', icon: Calendar },
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        { name: 'WhatsApp', path: '/whatsapp', icon: MessageCircle },
        { name: 'Call Intelligence', path: '/calls', icon: Phone },
        { name: 'Interactions', path: '/interactions', icon: MessageSquare },
      ],
    },
    {
      title: 'ADMIN & SETUP',
      items: [
        { name: 'Customers', path: '/customers', icon: UserCheck },
        { name: 'Property Owners', path: '/owners', icon: ShieldCheck },
        { name: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  const userInitials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20 flex-shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-sm">
            <Home className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-base tracking-wide leading-none text-white truncate">PropCRM</h1>
            <span className="text-xs text-slate-400 truncate block mt-0.5">{user.organizationName || 'Real Estate Intelligence'}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center font-bold text-white justify-center text-xs flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.role} • {user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-xs">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search phone (+91XXXXXXXXXX) or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50"
            />
          </form>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              <Shield className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              {user.organizationName} Workspace
            </div>
            <button
              onClick={() => navigate('/leads')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              + New Lead
            </button>
          </div>
        </header>

        {/* View Router */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/contacts" element={<ContactsView />} />
            <Route path="/contacts/:id" element={<ContactDetailView />} />
            <Route path="/customers" element={<GenericView title="Customers" icon={UserCheck} />} />
            <Route path="/owners" element={<GenericView title="Property Owners" icon={ShieldCheck} />} />
            <Route path="/properties" element={<PropertiesView />} />
            <Route path="/requirements" element={<RequirementsView />} />
            <Route path="/leads" element={<LeadsView />} />
            <Route path="/interactions" element={<GenericView title="Interactions Ledger" icon={MessageSquare} />} />
            <Route path="/calls" element={<CallsView />} />
            <Route path="/whatsapp" element={<WhatsAppView />} />
            <Route path="/visits" element={<VisitsView />} />
            <Route path="/followups" element={<FollowupsView />} />
            <Route path="/matches" element={<MatchesView />} />
            <Route path="/settings" element={<GenericView title="Organization Settings" icon={Settings} />} />
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
