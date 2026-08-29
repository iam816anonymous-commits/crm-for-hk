import React, { useState, useEffect, useCallback } from 'react';
import { Phone, MessageCircle, Shield, AlertCircle } from 'lucide-react';

export function CallsView() {
  const [phone, setPhone] = useState('+919876543210');
  const [userConsent, setUserConsent] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [intelligenceResults, setIntelligenceResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleUploadRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/calls/upload-recording', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneRaw: phone,
          filename: 'client_meeting_debrief.mp3',
          mimeType: 'audio/mpeg',
          userConsent: userConsent,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIntelligenceResults(prev => [data.data, ...prev]);
      } else {
        setError(data.error || 'Failed to process audio recording');
      }
    } catch (err: any) {
      setError(err.message || 'Network error during audio upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phone Call Intelligence & Audio STT</h1>
          <p className="text-sm text-gray-500">Mode B Permitted User Audio Upload & AI Extraction Pipeline</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode B: Permitted User Audio Upload & STT Form */}
      <div className="bg-indigo-900 text-white p-5 rounded-xl border border-indigo-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-md font-semibold text-indigo-300 flex items-center gap-2">
            <Phone className="w-5 h-5" /> Upload Permitted Call Recording for AI Intelligence
          </h2>
          <span className="bg-indigo-800 text-indigo-200 text-xs font-mono px-3 py-1 rounded-full border border-indigo-700">
            STT Engine: OpenAI Whisper
          </span>
        </div>

        <form onSubmit={handleUploadRecording} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-indigo-200 mb-1">Client Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-indigo-950 border border-indigo-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-400 font-mono"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer bg-indigo-950 border border-indigo-700 p-2.5 rounded-lg w-full">
              <input
                type="checkbox"
                checked={userConsent}
                onChange={(e) => setUserConsent(e.target.checked)}
                className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-400"
              />
              <span className="text-xs text-indigo-200">
                Explicit User Consent Verified (<strong className="text-white">userConsent = true</strong>)
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={uploading || !userConsent}
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2 justify-center disabled:opacity-50"
          >
            {uploading ? 'Transcribing STT...' : 'Upload & Transcribe Audio'}
          </button>
        </form>
      </div>

      {/* Call Intelligence Extracted Summary Cards */}
      {intelligenceResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" /> Extracted Call Intelligence & STT Transcripts
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {intelligenceResults.map((item, idx) => (
              <div key={idx} className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-md font-mono">
                    Call SID: {item.call?.externalCallSid}
                  </span>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Routing: Pending Human Approval Queue
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm text-slate-800 font-mono">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Generated STT Speech Transcript</span>
                  "{item.transcript}"
                </div>

                {item.requirement && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2">
                    <div className="bg-indigo-50 p-2.5 rounded border border-indigo-100">
                      <span className="text-indigo-600 font-bold block uppercase text-[10px]">Intent</span>
                      <strong className="text-slate-900 text-sm">{item.requirement.intent}</strong>
                    </div>
                    <div className="bg-indigo-50 p-2.5 rounded border border-indigo-100">
                      <span className="text-indigo-600 font-bold block uppercase text-[10px]">Min BHK</span>
                      <strong className="text-slate-900 text-sm">{item.requirement.minBedrooms} BHK</strong>
                    </div>
                    <div className="bg-indigo-50 p-2.5 rounded border border-indigo-100">
                      <span className="text-indigo-600 font-bold block uppercase text-[10px]">Max Budget</span>
                      <strong className="text-slate-900 text-sm">₹{item.requirement.maxBudget?.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="bg-indigo-50 p-2.5 rounded border border-indigo-100">
                      <span className="text-indigo-600 font-bold block uppercase text-[10px]">Move-In Date</span>
                      <strong className="text-slate-900 text-sm">{item.requirement.moveInDate || 'Immediate'}</strong>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function WhatsAppView() {
  const [phone, setPhone] = useState('+919876543210');
  const [name, setName] = useState('WhatsApp Customer');
  const [message, setMessage] = useState('I need 2bhk in Whitefield below 25k');
  const [simulating, setSimulating] = useState(false);
  const [ingestedMessages, setIngestedMessages] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessagesAndReviews = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [msgRes, revRes] = await Promise.all([
        fetch('/api/whatsapp/messages', { headers }),
        fetch('/api/reviews/pending', { headers }),
      ]);

      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setIngestedMessages(msgData.messages || []);
      }

      if (revRes.ok) {
        const revData = await revRes.json();
        setPendingReviews(revData.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessagesAndReviews();
  }, [fetchMessagesAndReviews]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/whatsapp/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone, name, message }),
      });
      setMessage('');
      await fetchMessagesAndReviews();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/reviews/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      fetchMessagesAndReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/reviews/${id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchMessagesAndReviews();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Ingestion & Human Approval Intelligence</h1>
          <p className="text-sm text-gray-500">Meta Cloud API Webhook Ingestion, AI Extraction & Verification Queue</p>
        </div>
      </div>

      {/* Human Approval Review Queue */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-amber-200 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-700" />
            <h2 className="font-bold text-amber-900 text-base">Human Approval System (Prevent AI Errors)</h2>
          </div>
          <span className="bg-amber-200 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
            {pendingReviews.length} Pending Verification
          </span>
        </div>

        {pendingReviews.length === 0 ? (
          <p className="text-sm text-amber-800 italic">No pending AI extractions requiring human approval.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReviews.map((rev) => (
              <div key={rev.requirement?.id} className="bg-white border border-amber-300 rounded-lg p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Requirement AI Extraction
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Confidence: {Math.round((rev.requirement?.extractionConfidence || 0.9) * 100)}%
                  </span>
                </div>

                <div className="space-y-1 text-sm text-slate-800">
                  <p><strong className="font-semibold text-slate-900">Req ID:</strong> {rev.requirement?.id?.substring(0, 8)}</p>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                    <div><span className="text-slate-500">BHK:</span> <strong>{rev.requirement?.minBedrooms}BHK</strong></div>
                    <div><span className="text-slate-500">Max Budget:</span> <strong>₹{rev.requirement?.maxBudget?.toLocaleString('en-IN')}</strong></div>
                    <div><span className="text-slate-500">Intent:</span> <strong>{rev.requirement?.intent}</strong></div>
                    <div><span className="text-slate-500">Move-in:</span> <strong>{rev.requirement?.moveInDate || 'Immediate'}</strong></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleApprove(rev.requirement?.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(rev.requirement?.id)}
                    className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold px-3 py-1.5 rounded transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simulator Form */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md">
        <h2 className="text-md font-semibold text-emerald-400 mb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" /> Simulate Meta Cloud API Inbound Webhook
        </h2>
        <form onSubmit={handleSimulate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Sender Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Sender Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">Raw Inbound Message Text</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. I need 2bhk in Whitefield below 25k"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={simulating}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-end disabled:opacity-50"
            >
              {simulating ? 'Ingesting...' : 'Send Webhook'}
            </button>
          </div>
        </form>
      </div>

      {/* Ingested Messages Feed */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-900 text-sm">Ingested Raw Messages & Extracted CRM Entities</h3>
          <span className="text-xs text-gray-500 font-mono">Count: {ingestedMessages.length}</span>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading ingested messages...</div>
          ) : ingestedMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No WhatsApp messages ingested yet. Use the simulator above to post a test message.</div>
          ) : (
            ingestedMessages.map((msg) => (
              <div key={msg.id} className="p-5 hover:bg-slate-50 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md font-mono">
                      {msg.senderPhone}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">ID: {msg.id.substring(0, 18)}...</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">Stored Raw Message Payload</span>
                  <p className="text-sm font-semibold text-emerald-950">"{msg.messageBody || msg.rawPayload}"</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function VisitsView() {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Visits Schedule</h1>
          <p className="text-sm text-gray-500">In-person site visits & appointment feedback</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center text-gray-500">
        <p className="text-base font-semibold text-gray-700">No scheduled visits</p>
        <p className="text-sm text-gray-500 mt-1">Site visits scheduled for property listings will appear here.</p>
      </div>
    </div>
  );
}

export function FollowupsView() {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-up Task Queue</h1>
          <p className="text-sm text-gray-500">Agent reminders & automated tenant nurture tasks</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center text-gray-500">
        <p className="text-base font-semibold text-gray-700">No pending follow-ups</p>
        <p className="text-sm text-gray-500 mt-1">Follow-up reminders assigned to leads will appear here.</p>
      </div>
    </div>
  );
}
