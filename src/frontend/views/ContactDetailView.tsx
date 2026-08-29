import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, MessageCircle } from 'lucide-react';
import { Badge } from '../components/Badge.js';
import { ProvenanceBadge } from '../components/ProvenanceBadge.js';
import { LoadingState, ErrorState } from '../components/States.js';

export default function ContactDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    fetch(`/api/contacts/${id}/details`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Contact not found or unauthorized');
        return res.json();
      })
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError('Contact profile not found');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load contact details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading canonical contact profile..." />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/contacts')}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Contacts
        </button>
        <ErrorState title="Contact Not Found" message={error || 'Profile unavailable'} />
      </div>
    );
  }

  const profile = data;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/contacts')}
        className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
        Back to Canonical Contacts
      </button>

      {/* Main Profile Header */}
      <div className="bg-white p-5 rounded-xl shadow-2xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
            {profile.name[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
              <ProvenanceBadge isVerifiedManually={profile.contact?.isVerifiedManually} />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Canonical Contact ID: {profile.contact?.id}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              {profile.roles?.map((role: string) => (
                <Badge key={role} variant="info">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <div className="bg-white p-5 rounded-xl shadow-2xs border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Contact Information</h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center text-slate-700 font-mono">
              <Phone className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
              <span>{profile.phoneFormatted || profile.contact?.phoneNormalized}</span>
            </div>
            {profile.contact?.email && (
              <div className="flex items-center text-slate-700">
                <Mail className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                <span>{profile.contact.email}</span>
              </div>
            )}
            {profile.contact?.address && (
              <div className="flex items-center text-slate-700">
                <MapPin className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                <span>{profile.contact.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Requirements Card */}
        <div className="bg-white p-5 rounded-xl shadow-2xs border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Active Requirement</h2>
          {profile.requirements ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">BHK</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{profile.requirements.bhk}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Location</p>
                <p className="text-sm font-bold text-slate-900 mt-1 truncate">{profile.requirements.location}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Budget</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{profile.requirements.budget}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No active requirement linked.</p>
          )}
        </div>

        {/* Interaction Summary */}
        <div className="bg-white p-5 rounded-xl shadow-2xs border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Interaction History</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
              <MessageCircle className="w-4 h-4 text-emerald-600 mx-auto" />
              <p className="text-base font-bold text-emerald-900 mt-1">{profile.interactionsCount?.whatsapp || 0}</p>
              <p className="text-[10px] text-emerald-700 font-bold uppercase">WhatsApp</p>
            </div>
            <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-100">
              <Phone className="w-4 h-4 text-sky-600 mx-auto" />
              <p className="text-base font-bold text-sky-900 mt-1">{profile.interactionsCount?.calls || 0}</p>
              <p className="text-[10px] text-sky-700 font-bold uppercase">Calls</p>
            </div>
            <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-100">
              <Calendar className="w-4 h-4 text-purple-600 mx-auto" />
              <p className="text-base font-bold text-purple-900 mt-1">{profile.interactionsCount?.visits || 0}</p>
              <p className="text-[10px] text-purple-700 font-bold uppercase">Visits</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
