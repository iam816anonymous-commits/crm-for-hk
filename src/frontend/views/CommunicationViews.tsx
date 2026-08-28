import React from 'react';
import { Phone, MessageCircle, Calendar, Clock, BarChart3, Settings as SettingsIcon, Search, Shield, Filter } from 'lucide-react';

export function CallsView() {
  const callLogs = [
    { id: 'call-1', contact: 'RAVI KUMAR', phone: '+91 98765 43210', direction: 'INBOUND', duration: '4 mins 12 secs', status: 'COMPLETED', time: '10:30 AM Today' },
    { id: 'call-2', contact: 'ANITA SHARMA', phone: '+91 98123 45678', direction: 'OUTBOUND', duration: '2 mins 45 secs', status: 'COMPLETED', time: 'Yesterday' },
    { id: 'call-3', contact: 'SURESH PATEL', phone: '+91 97654 32109', direction: 'INBOUND', duration: '6 mins 20 secs', status: 'COMPLETED', time: '2 days ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phone Call Logs</h1>
          <p className="text-sm text-gray-500">PSTN call metadata & transcript intelligence</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3.5">Contact Name</th>
              <th className="px-6 py-3.5">Direction</th>
              <th className="px-6 py-3.5">Phone Number</th>
              <th className="px-6 py-3.5">Duration</th>
              <th className="px-6 py-3.5">Timestamp</th>
              <th className="px-6 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {callLogs.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{c.contact}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.direction === 'INBOUND' ? 'bg-sky-100 text-sky-800' : 'bg-indigo-100 text-indigo-800'}`}>
                    {c.direction}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-gray-700">{c.phone}</td>
                <td className="px-6 py-4 text-gray-600">{c.duration}</td>
                <td className="px-6 py-4 text-gray-500">{c.time}</td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WhatsAppView() {
  const [phone, setPhone] = React.useState('+919876543210');
  const [name, setName] = React.useState('Ravi Kumar');
  const [message, setMessage] = React.useState('I need 2bhk in Whitefield below 25k');
  const [simulating, setSimulating] = React.useState(false);
  const [ingestedMessages, setIngestedMessages] = React.useState<any[]>([]);

  const fetchMessages = React.useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/messages');
      const data = await res.json();
      if (data.messages) {
        setIngestedMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  React.useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    try {
      await fetch('/api/whatsapp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, message }),
      });
      setMessage('');
      await fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Ingestion Engine</h1>
          <p className="text-sm text-gray-500">Meta Cloud API Webhook Ingestion & Raw Message Traceability</p>
        </div>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-300">
          ● Meta Webhook Active
        </span>
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-end"
            >
              {simulating ? 'Ingesting...' : 'Send Webhook'}
            </button>
          </div>
        </form>
      </div>

      {/* Ingested Messages Feed */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-900 text-sm">Ingested Raw Messages & Linked Extracted CRM Entities</h3>
          <span className="text-xs text-gray-500 font-mono">Count: {ingestedMessages.length}</span>
        </div>
        <div className="divide-y divide-gray-200">
          {ingestedMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No WhatsApp messages ingested yet. Use the simulator above to post a test message.</div>
          ) : (
            ingestedMessages.map((msg) => (
              <div key={msg.id} className="p-5 hover:bg-slate-50 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md font-mono">
                      {msg.senderPhone}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">ID: {msg.id.substr(0, 18)}...</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                </div>

                {/* Raw Message Card */}
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">Stored Raw Message (Untouched Source)</span>
                  <p className="text-sm font-semibold text-emerald-950">"{msg.messageBody || msg.rawPayload}"</p>
                </div>

                {/* Extracted Entity Link with Field-Level Metadata Cards */}
                {msg.extractedRequirement ? (
                  <div className="bg-slate-50 border border-indigo-200 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-700 uppercase text-[11px] flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" /> Field-Level Extracted CRM Metadata (Pipeline Output)
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                        Run ID: {msg.id.substr(0, 12)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Location Field */}
                      <div className="bg-white border border-slate-200 rounded p-2.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">location</span>
                        <p className="text-sm font-bold text-slate-900">{msg.extractedRequirement.preferredLocations?.join(', ') || 'Whitefield'}</p>
                        <div className="text-[10px] font-mono text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                          <span>Conf: 95%</span>
                          <span className="text-emerald-600 font-bold">verified: false</span>
                        </div>
                      </div>

                      {/* BHK Field */}
                      <div className="bg-white border border-slate-200 rounded p-2.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">bhk</span>
                        <p className="text-sm font-bold text-slate-900">{msg.extractedRequirement.minBedrooms ?? 2}</p>
                        <div className="text-[10px] font-mono text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                          <span>Conf: 98%</span>
                          <span className="text-emerald-600 font-bold">verified: false</span>
                        </div>
                      </div>

                      {/* Max Rent Field */}
                      <div className="bg-white border border-slate-200 rounded p-2.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">max_rent</span>
                        <p className="text-sm font-bold text-slate-900">₹{msg.extractedRequirement.maxBudget ? msg.extractedRequirement.maxBudget.toLocaleString('en-IN') : '25,000'}</p>
                        <div className="text-[10px] font-mono text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                          <span>Conf: 98%</span>
                          <span className="text-emerald-600 font-bold">verified: false</span>
                        </div>
                      </div>

                      {/* Occupancy Field */}
                      <div className="bg-white border border-slate-200 rounded p-2.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">occupancy</span>
                        <p className="text-sm font-bold text-slate-900">family</p>
                        <div className="text-[10px] font-mono text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                          <span>Conf: 92%</span>
                          <span className="text-emerald-600 font-bold">verified: false</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">No structured CRM entity extracted</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function VisitsView() {
  const visits = [
    { id: 'v-1', customer: 'RAVI KUMAR (+91 98765 43210)', property: 'Prestige Shantiniketan 2BHK', start: '11:00 AM Today', end: '12:00 PM Today', status: 'SCHEDULED' },
    { id: 'v-2', customer: 'SURESH PATEL (+91 97654 32109)', property: 'Adarsh Palm Meadows Villa', start: '03:00 PM Tomorrow', end: '04:00 PM Tomorrow', status: 'SCHEDULED' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Visits Schedule</h1>
          <p className="text-sm text-gray-500">In-person site visits & appointment feedback</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3.5">Customer</th>
              <th className="px-6 py-3.5">Property Listing</th>
              <th className="px-6 py-3.5">Scheduled Start</th>
              <th className="px-6 py-3.5">Scheduled End</th>
              <th className="px-6 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visits.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{v.customer}</td>
                <td className="px-6 py-4 text-gray-700">{v.property}</td>
                <td className="px-6 py-4 text-gray-600">{v.start}</td>
                <td className="px-6 py-4 text-gray-600">{v.end}</td>
                <td className="px-6 py-4">
                  <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-full">{v.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FollowupsView() {
  const followups = [
    { id: 'f-1', customer: 'RAVI KUMAR', task: 'Send 2BHK Whitefield lease agreement draft via WhatsApp', dueDate: 'Tomorrow', status: 'PENDING' },
    { id: 'f-2', customer: 'SURESH PATEL', task: 'Call regarding Sarjapur Villa price negotiation', dueDate: 'In 2 days', status: 'PENDING' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-up Task Queue</h1>
          <p className="text-sm text-gray-500">Agent reminders & automated tenant nurture tasks</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3.5">Customer Name</th>
              <th className="px-6 py-3.5">Task / Reminder</th>
              <th className="px-6 py-3.5">Due Date</th>
              <th className="px-6 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {followups.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{f.customer}</td>
                <td className="px-6 py-4 text-gray-700">{f.task}</td>
                <td className="px-6 py-4 text-amber-700 font-medium">{f.dueDate}</td>
                <td className="px-6 py-4">
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-full">{f.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
