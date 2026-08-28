import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, Calendar, Home, CheckCircle, XCircle, ArrowLeft, Clock, MapPin, IndianRupee } from 'lucide-react';

export default function ContactDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/contacts/${id || 'ravi-kumar-demo'}/details`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
        } else {
          // Fallback RAVI KUMAR default specs
          setData(getDefaultRaviKumarData());
        }
      })
      .catch(() => setData(getDefaultRaviKumarData()))
      .finally(() => setLoading(false));
  }, [id]);

  function getDefaultRaviKumarData() {
    return {
      name: 'RAVI KUMAR',
      roles: ['Tenant'],
      phoneFormatted: '+91 98765 43210',
      requirements: {
        bhk: '2BHK',
        location: 'Whitefield',
        budget: '₹25,000',
      },
      interactionsCount: {
        whatsapp: 12,
        calls: 4,
        visits: 2,
      },
      propertiesShown: 5,
      propertiesRejected: 2,
      lastContact: 'Today',
      nextFollowUp: 'Tomorrow',
    };
  }

  const profile = data || getDefaultRaviKumarData();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/contacts')}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 font-medium bg-white border border-gray-300 px-3.5 py-1.5 rounded-lg shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Contacts</span>
        </button>
        <span className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
          Canonical Contact ID: {id || 'ravi-kumar-demo'}
        </span>
      </div>

      {/* Hero Contact Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
            RK
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{profile.name}</h1>
              {profile.roles?.map((role: string) => (
                <span key={role} className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Role: {role}
                </span>
              ))}
            </div>
            <p className="text-base font-mono text-gray-600 mt-1 flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>Phone: {profile.phoneFormatted}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition">
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition">
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </button>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Requirements Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Home className="w-5 h-5 text-blue-600" />
            <span>Rental Requirements</span>
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-100">
              <span className="text-xs text-blue-600 font-medium block">Type</span>
              <span className="text-lg font-bold text-blue-900 mt-0.5 block">{profile.requirements?.bhk}</span>
            </div>
            <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-100">
              <span className="text-xs text-indigo-600 font-medium block">Location</span>
              <span className="text-base font-bold text-indigo-900 mt-0.5 block">{profile.requirements?.location}</span>
            </div>
            <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100">
              <span className="text-xs text-emerald-600 font-medium block">Budget</span>
              <span className="text-base font-bold text-emerald-900 mt-0.5 block">{profile.requirements?.budget}</span>
            </div>
          </div>
        </div>

        {/* Interaction Summary Breakdown */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span>Interactions</span>
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <span className="text-xs text-green-700 font-medium block">WhatsApp</span>
              <span className="text-xl font-bold text-green-900 mt-0.5 block">{profile.interactionsCount?.whatsapp}</span>
            </div>
            <div className="bg-sky-50 p-3 rounded-lg border border-sky-100">
              <span className="text-xs text-sky-700 font-medium block">Calls</span>
              <span className="text-xl font-bold text-sky-900 mt-0.5 block">{profile.interactionsCount?.calls}</span>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <span className="text-xs text-purple-700 font-medium block">Visits</span>
              <span className="text-xl font-bold text-purple-900 mt-0.5 block">{profile.interactionsCount?.visits}</span>
            </div>
          </div>
        </div>

        {/* Property Matching Stats */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Home className="w-5 h-5 text-amber-600" />
            <span>Property Matching</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-lg border border-gray-200">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Properties Shown</p>
                <p className="text-xl font-bold text-gray-900">{profile.propertiesShown}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-lg border border-gray-200">
              <XCircle className="w-8 h-8 text-rose-500" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Properties Rejected</p>
                <p className="text-xl font-bold text-gray-900">{profile.propertiesRejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Follow-up & Activity Timeline */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Activity Schedule</span>
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-sm font-medium text-slate-700">Last contact:</span>
              <span className="text-sm font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-300">
                {profile.lastContact}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-sm font-medium text-amber-800">Next follow-up:</span>
              <span className="text-sm font-bold text-amber-900 bg-white px-2.5 py-1 rounded border border-amber-300">
                {profile.nextFollowUp}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
