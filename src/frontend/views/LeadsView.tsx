import React from 'react';
import { Target, GitCompare, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LeadsView() {
  const navigate = useNavigate();

  const matches = [
    {
      leadId: 'lead-101',
      customer: 'RAVI KUMAR (+91 98765 43210)',
      requirement: '2BHK Whitefield (₹25,000)',
      matchedProperty: 'Modern 2BHK Apartment in Whitefield',
      matchScore: '98% Match',
      owner: 'ANITA SHARMA',
      stage: 'QUALIFIED',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads & Property Matches</h1>
          <p className="text-sm text-gray-500">Automated requirement-to-listing matching engine</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
          <GitCompare className="w-5 h-5 text-blue-600" />
          <span>Active High-Score Property Matches</span>
        </h2>

        {matches.map((m) => (
          <div key={m.leadId} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">{m.matchScore}</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">Stage: {m.stage}</span>
              </div>
              <p className="font-bold text-gray-900 text-base mt-2">{m.customer}</p>
              <p className="text-xs text-gray-500">Requirement: {m.requirement}</p>
              <p className="text-xs text-emerald-700 font-medium mt-1">&rarr; Matched with: {m.matchedProperty} (Owner: {m.owner})</p>
            </div>

            <button
              onClick={() => navigate('/contacts/ravi-kumar-demo')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow"
            >
              <span>View Match Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
