import React, { useState, useEffect } from 'react';
import { Home, CheckCircle2, Building2, UserPlus, Flame, Clock, Calendar, PhoneCall, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardView() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch((err) => console.error('Error fetching dashboard stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const metricCards = [
    { title: 'Total Properties', value: stats?.totalProperties ?? 18, icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Available', value: stats?.availableProperties ?? 12, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Occupied', value: stats?.occupiedProperties ?? 6, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'New Leads', value: stats?.newLeads ?? 14, icon: UserPlus, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Hot Leads', value: stats?.hotLeads ?? 5, icon: Flame, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'Pending Follow-ups', value: stats?.pendingFollowups ?? 8, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Today\'s Visits', value: stats?.todayVisits ?? 3, icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'Recent Calls', value: stats?.recentCallsCount ?? 4, icon: PhoneCall, color: 'text-sky-600', bg: 'bg-sky-50' },
    { title: 'Recent WhatsApp Enquiries', value: stats?.recentWhatsAppCount ?? 12, icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time rental property operations & communication intelligence</p>
        </div>
      </div>

      {/* Grid Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-5">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '...' : card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bg} ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo Contact Highlight Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <span className="bg-blue-600/60 text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">Featured Prospect</span>
          <h2 className="text-xl font-bold mt-2">RAVI KUMAR</h2>
          <p className="text-blue-200 text-sm mt-1">+91 98765 43210 • Tenant • 2BHK Whitefield ₹25,000</p>
        </div>
        <button
          onClick={() => navigate('/contacts/ravi-kumar-demo')}
          className="bg-white text-blue-900 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-semibold shadow transition"
        >
          View Full Profile
        </button>
      </div>
    </div>
  );
}
