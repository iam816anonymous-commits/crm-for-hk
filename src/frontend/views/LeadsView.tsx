import React, { useState, useEffect } from 'react';
import { Target, ChevronRight, XCircle, Clock, Ban, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LeadsView() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/leads', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.data || []);
      } else {
        setError('Failed to fetch lead pipeline data');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading leads');
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStage = async (leadId: string, nextStage: string, lostReason?: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stage: nextStage, lostReason }),
      });

      if (res.ok) {
        fetchLeads();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update lead stage');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating lead stage');
    }
  };

  const advanceStage = (leadId: string, currentStage: string) => {
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex >= 0 && currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      updateLeadStage(leadId, nextStage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Pipeline Board</h1>
          <p className="text-sm text-gray-500">Visual sales funnel tracking & stage transition pipeline</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading lead pipeline...
        </div>
      ) : (
        <>
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
                        No active leads
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div key={lead.id} className="bg-white rounded-lg p-3.5 border border-gray-200 shadow-sm space-y-2 hover:shadow-md transition">
                          <div className="flex items-center justify-between">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Score: {lead.score || 0}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => updateLeadStage(lead.id, 'ON_HOLD')}
                                title="Mark On Hold"
                                className="p-1 hover:bg-gray-100 rounded text-amber-600"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => updateLeadStage(lead.id, 'LOST', 'Client not interested')}
                                title="Mark Lost"
                                className="p-1 hover:bg-gray-100 rounded text-rose-600"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4
                            onClick={() => navigate(`/contacts/${lead.customerId}`)}
                            className="font-bold text-gray-900 text-sm hover:underline cursor-pointer"
                          >
                            Lead #{lead.id.substring(0, 8)}
                          </h4>

                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-mono">Priority: {lead.priority}</span>
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
                          Lead #{l.id.substring(0, 8)} - {l.lostReason || 'No reason specified'}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
