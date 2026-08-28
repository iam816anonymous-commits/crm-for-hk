import React from 'react';
import { ClipboardList, Plus, Search, Filter } from 'lucide-react';

export default function RequirementsView() {
  const reqs = [
    {
      id: 'req-1',
      customer: 'RAVI KUMAR (+91 98765 43210)',
      intent: 'RENT',
      bhk: '2BHK',
      location: 'Whitefield',
      budget: '₹25,000 / mo',
      confidence: '100% (Verified)',
      status: 'ACTIVE',
    },
    {
      id: 'req-2',
      customer: 'SURESH PATEL (+91 97654 32109)',
      intent: 'BUY',
      bhk: '3BHK Villa',
      location: 'Sarjapur Road',
      budget: '₹1.5 Cr',
      confidence: '92% (AI Extracted)',
      status: 'ACTIVE',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requirements</h1>
          <p className="text-sm text-gray-500">Tenant and buyer criteria captured manually or via AI intelligence</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow">
          <Plus className="w-4 h-4" />
          <span>New Requirement</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3.5">Customer</th>
              <th className="px-6 py-3.5">Intent</th>
              <th className="px-6 py-3.5">Type</th>
              <th className="px-6 py-3.5">Preferred Location</th>
              <th className="px-6 py-3.5">Max Budget</th>
              <th className="px-6 py-3.5">Extraction Provenance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reqs.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{r.customer}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.intent === 'RENT' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {r.intent}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700">{r.bhk}</td>
                <td className="px-6 py-4 text-gray-700">{r.location}</td>
                <td className="px-6 py-4 font-bold text-emerald-600">{r.budget}</td>
                <td className="px-6 py-4 text-xs font-mono text-gray-500">{r.confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
