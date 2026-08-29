import React, { useState, useEffect } from 'react';
import { Home, CheckCircle2, Building2, UserPlus, Flame, Clock, Calendar, PhoneCall, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingState, ErrorState } from '../components/States.js';

export default function DashboardView() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = () => {
    setLoading(true);
    setError(null);
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
  };

  const metricCards = [
    { title: 'Total Properties', value: stats?.totalProperties ?? 0, icon: Home, color: 'text-emerald-700', bg: 'bg-emerald-50', link: '/properties' },
    { title: 'Available Listings', value: stats?.availableProperties ?? 0, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', link: '/properties' },
    { title: 'Occupied Units', value: stats?.occupiedProperties ?? 0, icon: Building2, color: 'text-slate-700', bg: 'bg-slate-100', link: '/properties' },
    { title: 'New Leads', value: stats?.newLeads ?? 0, icon: UserPlus, color: 'text-amber-700', bg: 'bg-amber-50', link: '/leads' },
    { title: 'Hot Leads', value: stats?.hotLeads ?? 0, icon: Flame, color: 'text-rose-700', bg: 'bg-rose-50', link: '/leads' },
    { title: 'Pending Follow-ups', value: stats?.pendingFollowups ?? 0, icon: Clock, color: 'text-indigo-700', bg: 'bg-indigo-50', link: '/followups' },
    { title: 'Today\'s Visits', value: stats?.todayVisits ?? 0, icon: Calendar, color: 'text-teal-700', bg: 'bg-teal-50', link: '/visits' },
    { title: 'Recent Calls', value: stats?.recentCallsCount ?? 0, icon: PhoneCall, color: 'text-sky-700', bg: 'bg-sky-50', link: '/calls' },
    { title: 'WhatsApp Enquiries', value: stats?.recentWhatsAppCount ?? 0, icon: MessageSquare, color: 'text-emerald-700', bg: 'bg-emerald-50', link: '/whatsapp' },
  ];

  if (error) {
    return <ErrorState title="Error Loading Dashboard" message={error} onRetry={fetchStats} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Operations Dashboard</h1>
          <p className="text-xs text-slate-500">Real-time rental property operations & communication intelligence</p>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading dashboard operational metrics..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={() => navigate(card.link)}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between hover:shadow-xs transition cursor-pointer"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
