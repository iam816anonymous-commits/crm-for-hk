import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageCircle,
  FileText,
  Activity,
  Bot,
  CheckCircle,
  Sparkles,
  User,
  ShieldCheck,
  Clock,
  Send,
  Building,
} from 'lucide-react';
import { Badge } from '../components/Badge.js';
import { ProvenanceBadge } from '../components/ProvenanceBadge.js';
import { LoadingState, ErrorState, EmptyState } from '../components/States.js';

export default function ContactDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile360, setProfile360] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'conversations' | 'calls' | 'extractions'>('timeline');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    fetch(`/api/contacts/${id}/360`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Customer 360 profile not found or unauthorized');
        return res.json();
      })
      .then((res) => {
        if (res.success && res.data) {
          setProfile360(res.data);
        } else {
          setError('Customer 360 profile unavailable');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load Customer 360 profile');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <LoadingState message="Aggregating Customer 360 intelligence & activity timeline..." />;
  }

  if (error || !profile360) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/contacts')}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Contacts
        </button>
        <ErrorState title="Customer 360 Unavailable" message={error || 'Profile could not be retrieved'} />
      </div>
    );
  }

  const {
    contact,
    name,
    roles,
    phoneFormatted,
    requirement,
    lead,
    timeline,
    interactions,
    calls,
    whatsappMessages,
    siteVisits,
    aiExtractions,
    isVerifiedManually,
  } = profile360;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/contacts')}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Canonical Contacts
        </button>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Customer 360 Workspace</span>
        </div>
      </div>

      {/* Hero Customer Profile Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-2xs border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xl shadow-sm">
              {name[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{name}</h1>
                <ProvenanceBadge isVerifiedManually={isVerifiedManually} />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Contact ID: {contact.id} {contact.email ? `• ${contact.email}` : ''}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {roles?.map((role: string) => (
                  <Badge key={role} variant="info">
                    {role}
                  </Badge>
                ))}
                {lead && (
                  <Badge variant="warning">
                    Stage: {lead.stage}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100 self-start md:self-auto">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Activity Velocity</p>
              <p className="text-sm font-bold text-slate-800">{timeline?.length || 0} Events Recorded</p>
            </div>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Contact Info Chips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center text-slate-700 font-mono">
            <Phone className="w-4 h-4 mr-2 text-slate-400" />
            <span>{phoneFormatted}</span>
          </div>
          {contact.address ? (
            <div className="flex items-center text-slate-700">
              <MapPin className="w-4 h-4 mr-2 text-slate-400" />
              <span>{contact.address}</span>
            </div>
          ) : (
            <div className="flex items-center text-slate-400 italic">
              <MapPin className="w-4 h-4 mr-2" />
              <span>No address recorded</span>
            </div>
          )}
          {contact.notes ? (
            <div className="flex items-center text-slate-700">
              <FileText className="w-4 h-4 mr-2 text-slate-400" />
              <span className="truncate">{contact.notes}</span>
            </div>
          ) : (
            <div className="flex items-center text-slate-400 italic">
              <FileText className="w-4 h-4 mr-2" />
              <span>No notes attached</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid Layout: Left Details, Right Unified Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requirements, Lead Context, AI Insights */}
        <div className="space-y-6">
          {/* Active Requirement Card */}
          <div className="bg-white p-5 rounded-2xl shadow-2xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center">
                <Building className="w-4 h-4 mr-1.5 text-emerald-600" />
                Active Property Requirement
              </h2>
            </div>
            {requirement ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">BHK</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{requirement.minBedrooms ? `${requirement.minBedrooms} BHK` : 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Max Budget</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{requirement.maxBudget ? `₹${requirement.maxBudget.toLocaleString('en-IN')}` : 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Furnishing</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">{requirement.furnishingStatus || 'Any'}</p>
                  </div>
                </div>
                {requirement.preferredLocations && (
                  <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-500">Preferred Locations: </span>
                    <span className="text-slate-900 font-medium">
                      {Array.isArray(JSON.parse(requirement.preferredLocations))
                        ? JSON.parse(requirement.preferredLocations).join(', ')
                        : requirement.preferredLocations}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No active requirement linked to customer profile.</p>
            )}
          </div>

          {/* AI Extraction Insights Card */}
          <div className="bg-white p-5 rounded-2xl shadow-2xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" />
                Conversation Intelligence Insights
              </h2>
            </div>
            {aiExtractions && aiExtractions.length > 0 ? (
              <div className="space-y-3">
                {aiExtractions.slice(0, 3).map((ex: any) => {
                  const entities = ex.extractedEntitiesJson ? JSON.parse(ex.extractedEntitiesJson) : {};
                  return (
                    <div key={ex.id} className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900">{ex.providerName || 'AI Pipeline'}</span>
                        <Badge variant="info">{(ex.confidenceScore * 100).toFixed(0)}% Confidence</Badge>
                      </div>
                      {ex.rawText && <p className="text-slate-600 italic">"{ex.rawText.substring(0, 90)}..."</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No AI extractions processed for this contact yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Unified Chronological Activity Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Navigation Tabs */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center space-x-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'timeline' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unified Timeline ({timeline?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('conversations')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'conversations' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              WhatsApp ({whatsappMessages?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'calls' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Call Records ({calls?.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white p-5 rounded-2xl shadow-2xs border border-slate-200">
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Chronological Stream (Newest First)</h3>
                {timeline && timeline.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                    {timeline.map((event: any) => (
                      <div key={event.id} className="relative group">
                        {/* Timeline Node Icon */}
                        <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-500 group-hover:border-emerald-500 group-hover:text-emerald-600 transition">
                          {event.type === 'MESSAGE' && <MessageCircle className="w-3 h-3" />}
                          {event.type === 'CALL' && <Phone className="w-3 h-3" />}
                          {event.type === 'VISIT' && <Calendar className="w-3 h-3" />}
                          {event.type === 'AI_EXTRACTION' && <Sparkles className="w-3 h-3" />}
                          {event.type === 'INTERACTION' && <Activity className="w-3 h-3" />}
                        </div>

                        {/* Event Content Card */}
                        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{event.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(event.timestamp).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{event.summary}</p>

                          {/* Render call transcript if present */}
                          {event.metadata?.sttConfidence !== undefined && (
                            <div className="mt-2 text-[11px] bg-sky-50 p-2.5 rounded-lg border border-sky-100 text-sky-900">
                              <span className="font-bold">STT Transcript ({event.metadata.sttProvider}): </span>
                              <span>{event.summary}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No timeline events recorded yet." description="Conversations, calls, and visits linked to this customer will appear here chronologically." />
                )}
              </div>
            )}

            {activeTab === 'conversations' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Message Stream</h3>
                {whatsappMessages && whatsappMessages.length > 0 ? (
                  <div className="space-y-3">
                    {whatsappMessages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl max-w-md text-xs border ${
                          msg.direction === 'INBOUND'
                            ? 'bg-slate-100 border-slate-200 text-slate-800 self-start'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-950 ml-auto'
                        }`}
                      >
                        <p className="font-medium">{msg.content}</p>
                        <p className="text-[10px] text-slate-400 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No WhatsApp messages" description="No inbound or outbound WhatsApp messages found for this customer." />
                )}
              </div>
            )}

            {activeTab === 'calls' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Call Logs & Transcripts</h3>
                {calls && calls.length > 0 ? (
                  <div className="space-y-3">
                    {calls.map((call: any) => (
                      <div key={call.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{call.callType} Call ({call.durationSeconds || 0}s)</span>
                          <span className="text-[10px] text-slate-400">{new Date(call.createdAt).toLocaleDateString()}</span>
                        </div>
                        {call.transcript && (
                          <div className="p-2 bg-white rounded border border-slate-100 italic text-slate-700">
                            "{call.transcript}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No call logs recorded" description="No phone call metadata or audio recordings ingested for this contact." />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
