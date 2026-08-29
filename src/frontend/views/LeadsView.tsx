import React, { useState, useEffect } from 'react';
import { Target, ChevronRight, XCircle, Clock, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/Badge.js';
import { LoadingState, ErrorState } from '../components/States.js';

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

  if (error) {
    return <ErrorState message={error} onRetry={fetchLeads} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lead Pipeline Board</h1>
          <p className="text-xs text-slate-500">Visual sales funnel tracking & stage transition pipeline</p>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading lead pipeline stages..." />
      ) : (
        <>
          {/* Kanban Board Horizontal Scroll */}
          <div className="flex gap-4 overflow-x-auto pb-6">
            {stages.map((stage) => {
              const stageLeads = leads.filter((l) => l.stage === stage);
              return (
                <div key={stage} className="w-72 flex-shrink-0 bg-slate-100 rounded-xl p-3 border border-slate-200 flex flex-col space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-bold text-slate-700 tracking-wider uppercase">
                      {stage.replace('_', ' ')}
                    </span>
                    <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full font-mono">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto min-h-[280px]">
                    {stageLeads.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg p-4">
                        No active leads
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div key={lead.id} className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs space-y-2 hover:shadow-xs transition">
                          <div className="flex items-center justify-between">
                            <Badge variant="success" size="sm">
                              Score: {lead.score || 0}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => updateLeadStage(lead.id, 'ON_HOLD')}
                                title="Mark On Hold"
                                className="p-1 hover:bg-slate-100 rounded text-amber-600"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => updateLeadStage(lead.id, 'LOST', 'Client not interested')}
                                title="Mark Lost"
                                className="p-1 hover:bg-slate-100 rounded text-rose-600"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4
                            onClick={() => navigate(`/contacts/${lead.customerId}`)}
                            className="font-bold text-slate-900 text-xs font-mono hover:underline cursor-pointer"
                          >
                            Lead #{lead.id.substring(0, 8)}
                          </h4>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Priority: {lead.priority}</span>
                            {stage !== 'CLOSED' && (
                              <button
                                onClick={() => advanceStage(lead.id, lead.stage)}
                                className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-2xs"
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
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Ban className="w-4 h-4 text-slate-500" />
              <span>Terminal Leads (Lost / On Hold / Not Interested)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {terminalStates.map((term) => {
                const termLeads = leads.filter((l) => l.stage === term);
                return (
                  <div key={term} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-600 mb-2 uppercase">{term.replace('_', ' ')} ({termLeads.length})</p>
                    {termLeads.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">None</p>
                    ) : (
                      termLeads.map((l) => (
                        <div key={l.id} className="text-xs font-medium text-slate-800 bg-white p-2 rounded border border-slate-200 my-1 font-mono">
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
