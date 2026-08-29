import React, { useState, useEffect } from 'react';
import { GitCompare, Sparkles, Send, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Deterministic Property Matching Engine</h1>
          <p className="text-sm text-gray-500">Scoring requirements against property listings using explicit criterion weights</p>
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
          Loading requirements & property inventory...
        </div>
      ) : requirements.length === 0 || properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <GitCompare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-700">Insufficient Data for Matching</p>
          <p className="text-sm text-gray-500 mt-1">
            Please ensure you have at least one active customer requirement and one property listing in your organization.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Selector & Comparison */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selection Controls */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Requirement</label>
                <select
                  value={selectedReqId}
                  onChange={(e) => handleReqChange(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 font-medium"
                >
                  {requirements.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.minBedrooms}BHK • Max ₹{r.maxBudget?.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Property</label>
                <select
                  value={selectedPropId}
                  onChange={(e) => handlePropChange(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 font-medium"
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    Deterministic Match Score
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">
                    {currentProp?.title}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-emerald-600">
                    {scoring ? '...' : `${matchResult?.totalScorePercentage ?? 0}%`}
                  </span>
                  <span className="block text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full mt-0.5">
                    {matchResult?.matchLevel ?? 'EVALUATING'} MATCH
                  </span>
                </div>
              </div>

              {/* Comparison Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Requirement Box */}
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-2">
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-blue-200 pb-1.5">
                    Tenant Requirement
                  </p>
                  <div className="text-xs space-y-1 text-blue-950">
                    <p><span className="font-semibold">BHK:</span> {currentReq?.minBedrooms}BHK</p>
                    <p><span className="font-semibold">Budget:</span> ₹{currentReq?.maxBudget?.toLocaleString('en-IN')}</p>
                    <p><span className="font-semibold">Furnishing:</span> {currentReq?.furnishingStatus}</p>
                    <p><span className="font-semibold">Type:</span> {currentReq?.propertyType}</p>
                  </div>
                </div>

                {/* Property Box */}
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-2">
                  <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-1.5">
                    Property Listing
                  </p>
                  <div className="text-xs space-y-1 text-emerald-950">
                    <p><span className="font-semibold">BHK:</span> {currentProp?.bedrooms}BHK</p>
                    <p><span className="font-semibold">Rent:</span> ₹{currentProp?.monthlyRent?.toLocaleString('en-IN')}</p>
                    <p><span className="font-semibold">Furnishing:</span> {currentProp?.furnishingStatus}</p>
                    <p><span className="font-semibold">Type:</span> {currentProp?.propertyType}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => navigate('/whatsapp')}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Property Details</span>
                </button>
                <button
                  onClick={() => navigate('/visits')}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule Site Visit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Criteria Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-base border-b pb-3 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Weighted Criteria Breakdown</span>
            </h3>

            <div className="space-y-3">
              {matchResult?.breakdown?.map((item: any) => (
                <div key={item.criteriaName} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-700">{item.criteriaName} ({item.weightPercentage}%)</span>
                    <span className="text-emerald-600 font-bold">+{item.weightedScore}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${item.earnedScorePercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-400">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
