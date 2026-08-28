import React, { useState } from 'react';
import { Target, GitCompare, ChevronRight, XCircle, Clock, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LeadsView() {
  const navigate = useNavigate();

  // Active Funnel Stages
  const stages = [
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'PROPERTIES_SENT',
    'VISIT_SCHEDULED',
    'VISITED',
    'NEGOTIATION',
    'CLOSED',
  ];

  // Terminal States
  const terminalStates = ['LOST', 'NOT_INTERESTED', 'ON_HOLD'];

  const [leads, setLeads] = useState([
    {
      id: 'lead-1',
      customerName: 'RAVI KUMAR',
      phone: '+91 98765 43210',
      requirement: '2BHK Whitefield (₹25,000)',
      matchedProperty: 'Prestige Shantiniketan 2BHK',
      score: '98% Match',
      stage: 'QUALIFIED',
    },
    {
      id: 'lead-2',
      customerName: 'SURESH PATEL',
      phone: '+91 97654 32109',
      requirement: '3BHK Villa Sarjapur (₹1.5 Cr)',
      matchedProperty: 'Adarsh Palm Meadows Villa',
      score: '91% Match',
      stage: 'PROPERTIES_SENT',
    },
    {
      id: 'lead-3',
      customerName: 'PRIYA NAIR',
      phone: '+91 98222 33344',
      requirement: '1BHK Studio ITPL (₹18,000)',
      matchedProperty: 'Compact 1BHK Studio ITPL',
      score: '85% Match',
      stage: 'VISIT_SCHEDULED',
    },
  ]);

  const advanceStage = (leadId: string, currentStage: string) => {
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex >= 0 && currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      setLeads(leads.map(l => l.id === leadId ? { ...l, stage: nextStage } : l));
    }
  };

  const setTerminalState = (leadId: string, terminalStage: string) => {
    setLeads(leads.map(l => l.id === leadId ? { ...l, stage: terminalStage } : l));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Pipeline Board</h1>
          <p className="text-sm text-gray-500">Visual sales funnel tracking & stage transition pipeline</p>
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage);
          return (
            <div key={stage} className="w-72 flex-shrink-0 bg-gray-100 rounded-xl p-3 border border-gray-200 flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-xs font-bold text-gray-700 tracking-wider uppercase">
                  {stage.replace('_', ' ')}
                </span>
                <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto min-h-[300px]">
                {stageLeads.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg p-4">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div key={lead.id} className="bg-white rounded-lg p-3.5 border border-gray-200 shadow-sm space-y-2 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {lead.score}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setTerminalState(lead.id, 'ON_HOLD')}
                            title="Mark On Hold"
                            className="p-1 hover:bg-gray-100 rounded text-amber-600"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTerminalState(lead.id, 'LOST')}
                            title="Mark Lost"
                            className="p-1 hover:bg-gray-100 rounded text-rose-600"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4
                        onClick={() => navigate('/contacts/ravi-kumar-demo')}
                        className="font-bold text-gray-900 text-sm hover:underline cursor-pointer"
                      >
                        {lead.customerName}
                      </h4>
                      <p className="text-xs text-gray-500 font-mono">{lead.phone}</p>
                      <p className="text-xs text-blue-800 bg-blue-50 p-1.5 rounded border border-blue-100 font-medium">
                        {lead.requirement}
                      </p>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <button
                          onClick={() => navigate('/contacts/ravi-kumar-demo')}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Details
                        </button>
                        {stage !== 'CLOSED' && (
                          <button
                            onClick={() => advanceStage(lead.id, lead.stage)}
                            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-sm"
                          >
                            <span>Advance</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Leads Section */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-3">
        <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
          <Ban className="w-5 h-5 text-gray-500" />
          <span>Terminal Leads (Lost / On Hold / Not Interested)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {terminalStates.map((term) => {
            const termLeads = leads.filter((l) => l.stage === term);
            return (
              <div key={term} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-bold text-gray-600 mb-2 uppercase">{term.replace('_', ' ')} ({termLeads.length})</p>
                {termLeads.length === 0 ? (
                  <p className="text-xs text-gray-400">None</p>
                ) : (
                  termLeads.map((l) => (
                    <div key={l.id} className="text-xs font-medium text-gray-800 bg-white p-2 rounded border my-1">
                      {l.customerName} - {l.requirement}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
