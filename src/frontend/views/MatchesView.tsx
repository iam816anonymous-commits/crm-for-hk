import React, { useState } from 'react';
import { GitCompare, CheckCircle2, ChevronRight, Home, User, Sparkles, Send, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MatchesView() {
  const navigate = useNavigate();

  const [selectedMatch, setSelectedMatch] = useState<any>({
    customerName: 'RAVI KUMAR',
    phone: '+91 98765 43210',
    requirement: {
      bhk: '2BHK',
      location: 'Whitefield',
      budget: '₹25,000 / mo',
      furnishing: 'Semi-Furnished',
      moveIn: 'September 2026',
      special: 'Covered parking, gym, balcony',
    },
    property: {
      id: 'P102',
      title: 'Prestige Shantiniketan P102',
      bhk: '2BHK',
      location: 'Whitefield, Bangalore',
      rent: '₹23,000 / mo',
      furnishing: 'Semi-Furnished',
      availableFrom: 'Sept 1, 2026',
      owner: 'ANITA SHARMA (+91 98123 45678)',
    },
    totalScorePercentage: 94,
    matchLevel: 'EXCELLENT',
    breakdown: [
      { criteriaName: 'Location Match', weightPercentage: 30, earnedScorePercentage: 100, weightedScore: 30, details: 'Exact match for location Whitefield' },
      { criteriaName: 'BHK Match', weightPercentage: 20, earnedScorePercentage: 100, weightedScore: 20, details: 'Exact 2BHK match' },
      { criteriaName: 'Budget Match', weightPercentage: 20, earnedScorePercentage: 100, weightedScore: 20, details: 'Rent ₹23,000 within ₹25,000 budget' },
      { criteriaName: 'Furnishing Match', weightPercentage: 10, earnedScorePercentage: 100, weightedScore: 10, details: 'Exact Semi-Furnished match' },
      { criteriaName: 'Availability Match', weightPercentage: 10, earnedScorePercentage: 100, weightedScore: 10, details: 'Available Sept 1, 2026' },
      { criteriaName: 'Property Type Match', weightPercentage: 5, earnedScorePercentage: 100, weightedScore: 5, details: 'Apartment' },
      { criteriaName: 'Other Requirements', weightPercentage: 5, earnedScorePercentage: 80, weightedScore: 4, details: 'Matched parking, gym, balcony keywords' },
    ],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deterministic Property Matching Engine</h1>
          <p className="text-sm text-gray-500">Scoring requirements against property listings using explicit criterion weights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requirements & Property Comparison */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  Requirement vs Property Match
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedMatch.customerName} &rarr; {selectedMatch.property.title}</h2>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-emerald-600">{selectedMatch.totalScorePercentage}%</span>
                <span className="block text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full mt-0.5">
                  {selectedMatch.matchLevel} MATCH
                </span>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Requirement Box */}
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-2">
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider border-b border-blue-200 pb-1.5">
                  Ravi Requirement
                </p>
                <div className="text-xs space-y-1 text-blue-950">
                  <p><span className="font-semibold">BHK:</span> {selectedMatch.requirement.bhk}</p>
                  <p><span className="font-semibold">Location:</span> {selectedMatch.requirement.location}</p>
                  <p><span className="font-semibold">Budget:</span> {selectedMatch.requirement.budget}</p>
                  <p><span className="font-semibold">Furnishing:</span> {selectedMatch.requirement.furnishing}</p>
                  <p><span className="font-semibold">Move-In:</span> {selectedMatch.requirement.moveIn}</p>
                </div>
              </div>

              {/* Property Box */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-2">
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-1.5">
                  Property P102 Listing
                </p>
                <div className="text-xs space-y-1 text-emerald-950">
                  <p><span className="font-semibold">BHK:</span> {selectedMatch.property.bhk}</p>
                  <p><span className="font-semibold">Location:</span> {selectedMatch.property.location}</p>
                  <p><span className="font-semibold">Rent:</span> {selectedMatch.property.rent}</p>
                  <p><span className="font-semibold">Furnishing:</span> {selectedMatch.property.furnishing}</p>
                  <p><span className="font-semibold">Available:</span> {selectedMatch.property.availableFrom}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => navigate('/contacts/ravi-kumar-demo')}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow"
              >
                <Send className="w-4 h-4" />
                <span>Send Property via WhatsApp</span>
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
            {selectedMatch.breakdown.map((item: any) => (
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
    </div>
  );
}
