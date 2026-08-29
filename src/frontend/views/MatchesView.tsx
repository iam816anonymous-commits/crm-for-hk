import React, { useState, useEffect } from 'react';
import { GitCompare, Sparkles, Send, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { Badge } from '../components/Badge.js';
import { EmptyState, LoadingState, ErrorState } from '../components/States.js';

export default function MatchesView() {
  const navigate = useNavigate();

  const [requirements, setRequirements] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  const [selectedPropId, setSelectedPropId] = useState<string>('');
  const [matchResult, setMatchResult] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [reqsRes, propsRes] = await Promise.all([
        fetch('/api/requirements', { headers }),
        fetch('/api/properties', { headers }),
      ]);

      if (reqsRes.ok && propsRes.ok) {
        const reqsData = await reqsRes.json();
        const propsData = await propsRes.json();

        const reqsList = reqsData.data || [];
        const propsList = propsData.data || [];

        setRequirements(reqsList);
        setProperties(propsList);

        if (reqsList.length > 0 && propsList.length > 0) {
          setSelectedReqId(reqsList[0].id);
          setSelectedPropId(propsList[0].id);
          calculateScore(reqsList[0], propsList[0]);
        }
      } else {
        setError('Failed to load requirements or properties');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading matching engine data');
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = async (reqObj: any, propObj: any) => {
    if (!reqObj || !propObj) return;
    setScoring(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/matches/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requirement: {
            bhk: reqObj.minBedrooms,
            location: reqObj.preferredLocations ? (JSON.parse(reqObj.preferredLocations)[0] || 'Any') : 'Any',
            budget: reqObj.maxBudget,
            furnishing: reqObj.furnishingStatus,
            moveInDate: reqObj.moveInDate,
            propertyType: reqObj.propertyType,
            specialRequirements: reqObj.specialRequirements,
          },
          property: {
            bhk: propObj.bedrooms,
            location: propObj.city || propObj.address,
            rent: propObj.monthlyRent,
            furnishing: propObj.furnishingStatus,
            availableFrom: propObj.availableFrom,
            propertyType: propObj.propertyType,
            description: propObj.description,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMatchResult(data.data);
      }
    } catch (err) {
      console.error('Scoring error', err);
    } finally {
      setScoring(false);
    }
  };

  const handleReqChange = (id: string) => {
    setSelectedReqId(id);
    const reqObj = requirements.find(r => r.id === id);
    const propObj = properties.find(p => p.id === selectedPropId);
    calculateScore(reqObj, propObj);
  };

  const handlePropChange = (id: string) => {
    setSelectedPropId(id);
    const reqObj = requirements.find(r => r.id === selectedReqId);
    const propObj = properties.find(p => p.id === id);
    calculateScore(reqObj, propObj);
  };

  const currentReq = requirements.find(r => r.id === selectedReqId);
  const currentProp = properties.find(p => p.id === selectedPropId);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Deterministic Property Matching Engine</h1>
          <p className="text-xs text-slate-500">Scoring requirements against property listings using explicit criterion weights</p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {loading ? (
        <LoadingState message="Loading requirements & property inventory..." />
      ) : requirements.length === 0 || properties.length === 0 ? (
        <EmptyState
          icon={GitCompare}
          title="Insufficient Data for Matching"
          description="Please ensure you have at least one active customer requirement and one property listing in your organization."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Selector & Comparison */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selection Controls */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Requirement</label>
                <select
                  value={selectedReqId}
                  onChange={(e) => handleReqChange(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 font-medium text-slate-900"
                >
                  {requirements.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.minBedrooms}BHK • Max ₹{r.maxBudget?.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Property</label>
                <select
                  value={selectedPropId}
                  onChange={(e) => handlePropChange(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 font-medium text-slate-900"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (₹{p.monthlyRent?.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Score Summary Box */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Deterministic Match Engine
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {currentProp?.title}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-emerald-700 font-mono">
                    {scoring ? '...' : `${matchResult?.totalScorePercentage ?? 0}%`}
                  </span>
                  <div className="mt-0.5">
                    <Badge variant="success" size="sm">
                      {matchResult?.matchLevel ?? 'EVALUATING'} MATCH
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Comparison Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Requirement Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                    Tenant Requirement
                  </p>
                  <div className="text-xs space-y-1 text-slate-800">
                    <p><span className="font-semibold text-slate-500">BHK:</span> {currentReq?.minBedrooms}BHK</p>
                    <p><span className="font-semibold text-slate-500">Budget:</span> ₹{currentReq?.maxBudget?.toLocaleString('en-IN')}</p>
                    <p><span className="font-semibold text-slate-500">Furnishing:</span> {currentReq?.furnishingStatus}</p>
                    <p><span className="font-semibold text-slate-500">Type:</span> {currentReq?.propertyType}</p>
                  </div>
                </div>

                {/* Property Box */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-2">
                  <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-1.5">
                    Property Listing
                  </p>
                  <div className="text-xs space-y-1 text-emerald-950">
                    <p><span className="font-semibold text-emerald-700">BHK:</span> {currentProp?.bedrooms}BHK</p>
                    <p><span className="font-semibold text-emerald-700">Rent:</span> ₹{currentProp?.monthlyRent?.toLocaleString('en-IN')}</p>
                    <p><span className="font-semibold text-emerald-700">Furnishing:</span> {currentProp?.furnishingStatus}</p>
                    <p><span className="font-semibold text-emerald-700">Type:</span> {currentProp?.propertyType}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <Button variant="secondary" icon={Send} onClick={() => navigate('/whatsapp')}>
                  Send Details via WhatsApp
                </Button>
                <Button variant="primary" icon={Calendar} onClick={() => navigate('/visits')}>
                  Schedule Site Visit
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Criteria Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Weighted Criteria Breakdown</span>
            </h3>

            <div className="space-y-3">
              {matchResult?.breakdown?.map((item: any) => (
                <div key={item.criteriaName} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{item.criteriaName} ({item.weightPercentage}%)</span>
                    <span className="text-emerald-700 font-bold font-mono">+{item.weightedScore}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${item.earnedScorePercentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
