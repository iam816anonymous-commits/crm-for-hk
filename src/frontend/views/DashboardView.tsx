import React, { useState, useEffect } from 'react';
import { Home, CheckCircle2, Building2, UserPlus, Flame, Clock, Calendar, PhoneCall, MessageSquare, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardView() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch('/api/dashboard/stats', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load dashboard metrics');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error || 'Failed to load stats');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const metricCards = [
    { title: 'Total Properties', value: stats?.totalProperties ?? 0, icon: Home, color: 'text-blue-600', bg: 'bg-blue-50', link: '/properties' },
    { title: 'Available Properties', value: stats?.availableProperties ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/properties' },
    { title: 'Occupied Properties', value: stats?.occupiedProperties ?? 0, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', link: '/properties' },
    { title: 'New Leads', value: stats?.newLeads ?? 0, icon: UserPlus, color: 'text-amber-600', bg: 'bg-amber-50', link: '/leads' },
    { title: 'Hot Leads', value: stats?.hotLeads ?? 0, icon: Flame, color: 'text-rose-600', bg: 'bg-rose-50', link: '/leads' },
    { title: 'Pending Follow-ups', value: stats?.pendingFollowups ?? 0, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/followups' },
    { title: 'Today\'s Visits', value: stats?.todayVisits ?? 0, icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50', link: '/visits' },
    { title: 'Recent Calls', value: stats?.recentCallsCount ?? 0, icon: PhoneCall, color: 'text-sky-600', bg: 'bg-sky-50', link: '/calls' },
    { title: 'WhatsApp Enquiries', value: stats?.recentWhatsAppCount ?? 0, icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50', link: '/whatsapp' },
  ];

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex items-center space-x-3">
        <AlertCircle className="w-6 h-6 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-base">Error Loading Dashboard</h3>
          <p className="text-sm mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time rental property operations & communication intelligence</p>
        </div>
      </div>

      {/* Grid Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-5">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition cursor-pointer"
            >
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
    </div>
  );
}
