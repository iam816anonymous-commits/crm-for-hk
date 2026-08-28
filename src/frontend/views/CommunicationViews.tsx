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
  const messages = [
    { id: 'wa-1', contact: 'RAVI KUMAR', phone: '+91 98765 43210', preview: 'Looking for a 2BHK in Whitefield around ₹25,000 rent. Is Prestige Shantiniketan available?', direction: 'INBOUND', count: 12, time: '11:15 AM Today' },
    { id: 'wa-2', contact: 'ANITA SHARMA', phone: '+91 98123 45678', preview: 'Hi Ravi, rent deposit agreement document is ready for review.', direction: 'OUTBOUND', count: 8, time: 'Yesterday' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Conversations</h1>
          <p className="text-sm text-gray-500">Official Meta Cloud API message stream & automated AI entity extraction</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3.5">Contact Name</th>
              <th className="px-6 py-3.5">Phone Number</th>
              <th className="px-6 py-3.5">Latest Message Preview</th>
              <th className="px-6 py-3.5">Total Messages</th>
              <th className="px-6 py-3.5">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {messages.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{m.contact}</td>
                <td className="px-6 py-4 font-mono text-gray-700">{m.phone}</td>
                <td className="px-6 py-4 text-gray-600 max-w-md truncate">{m.preview}</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">{m.count} messages</span>
                </td>
                <td className="px-6 py-4 text-gray-500">{m.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
