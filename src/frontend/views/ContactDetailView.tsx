import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, CheckCircle2,
  Clock, Calendar, MessageCircle, AlertCircle, User
} from 'lucide-react';

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
        if (!res.ok) throw new Error('Contact not found');
        return res.json();
      })
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError('Contact not found');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load contact details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading contact profile...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/contacts')}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Contacts
        </button>
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Contact Not Found</h2>
          <p className="text-sm text-gray-500 mt-1">The requested contact record could not be found or you do not have permission to view it.</p>
        </div>
      </div>
    );
  }

  const profile = data;

  return (
    <div className="space-y-6">
      {/* Header Back Button */}
      <button
        onClick={() => navigate('/contacts')}
        className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Canonical Contacts
      </button>

      {/* Main Profile Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xl shadow-md">
            {profile.name[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              {profile.contact?.isVerifiedManually && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Manually Verified
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Canonical Contact ID: {profile.contact?.id}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              {profile.roles?.map((role: string) => (
                <span key={role} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md text-xs border border-blue-200">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">Contact Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center text-gray-700">
              <Phone className="w-4 h-4 mr-3 text-gray-400" />
              <span>{profile.phoneFormatted || profile.contact?.phoneNormalized}</span>
            </div>
            {profile.contact?.email && (
              <div className="flex items-center text-gray-700">
                <Mail className="w-4 h-4 mr-3 text-gray-400" />
                <span>{profile.contact.email}</span>
              </div>
            )}
            {profile.contact?.address && (
              <div className="flex items-center text-gray-700">
                <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                <span>{profile.contact.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Requirements Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">Active Requirement</h2>
          {profile.requirements ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-400 font-medium">BHK</p>
                <p className="text-base font-bold text-gray-900 mt-1">{profile.requirements.bhk}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-400 font-medium">Location</p>
                <p className="text-base font-bold text-gray-900 mt-1 truncate">{profile.requirements.location}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-400 font-medium">Budget</p>
                <p className="text-base font-bold text-gray-900 mt-1">{profile.requirements.budget}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active requirement linked.</p>
          )}
        </div>

        {/* Interaction Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">Interaction Ledger</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              <MessageCircle className="w-4 h-4 text-emerald-600 mx-auto" />
              <p className="text-lg font-bold text-emerald-900 mt-1">{profile.interactionsCount?.whatsapp || 0}</p>
              <p className="text-xs text-emerald-600 font-medium">WhatsApp</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <Phone className="w-4 h-4 text-blue-600 mx-auto" />
              <p className="text-lg font-bold text-blue-900 mt-1">{profile.interactionsCount?.calls || 0}</p>
              <p className="text-xs text-blue-600 font-medium">Calls</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <Calendar className="w-4 h-4 text-purple-600 mx-auto" />
              <p className="text-lg font-bold text-purple-900 mt-1">{profile.interactionsCount?.visits || 0}</p>
              <p className="text-xs text-purple-600 font-medium">Visits</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
