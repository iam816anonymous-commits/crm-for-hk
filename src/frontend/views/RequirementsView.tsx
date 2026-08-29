import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, X, AlertCircle } from 'lucide-react';

export default function RequirementsView() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [reqs, setReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerPhoneRaw: '',
    customerName: '',
    intent: 'RENT',
    propertyType: 'APARTMENT',
    minBedrooms: 2, // BHK
    preferredLocations: 'Whitefield',
    minBudget: '20000',
    maxBudget: '25000',
    furnishingStatus: 'SEMI_FURNISHED',
    moveInDate: new Date().toISOString().split('T')[0],
    occupancyType: 'FAMILY',
    specialRequirements: '',
  });

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/requirements', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReqs(data.data || []);
      } else {
        setError('Failed to fetch requirements');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerPhoneRaw: formData.customerPhoneRaw,
          customerName: formData.customerName,
          intent: formData.intent,
          propertyType: formData.propertyType,
          minBedrooms: Number(formData.minBedrooms),
          preferredLocations: [formData.preferredLocations],
          minBudget: Number(formData.minBudget),
          maxBudget: Number(formData.maxBudget),
          furnishingStatus: formData.furnishingStatus,
          moveInDate: formData.moveInDate,
          occupancyType: formData.occupancyType,
          specialRequirements: formData.specialRequirements,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchRequirements();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save requirement');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting requirement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Requirements Ledger</h1>
          <p className="text-sm text-gray-500">Tenant and buyer criteria captured manually or via AI intelligence</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Requirement</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading requirements...
          </div>
        ) : reqs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-700">No active requirements found</p>
            <p className="text-sm text-gray-500 mt-1">Capture tenant criteria manually or receive inbound WhatsApp enquiries.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3.5">Intent / Type</th>
                <th className="px-6 py-3.5">Min BHK</th>
                <th className="px-6 py-3.5">Preferred Locations</th>
                <th className="px-6 py-3.5">Max Budget</th>
                <th className="px-6 py-3.5">Occupancy</th>
                <th className="px-6 py-3.5">Move-In Date</th>
                <th className="px-6 py-3.5">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reqs.map((r) => {
                let locations = [];
                try {
                  locations = r.preferredLocations ? JSON.parse(r.preferredLocations) : [];
                } catch {
                  locations = [r.preferredLocations];
                }

                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{r.intent} • {r.propertyType}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{r.minBedrooms ? `${r.minBedrooms}BHK` : 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-700">{locations.join(', ') || 'Any'}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">₹{r.maxBudget?.toLocaleString('en-IN') || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full w-max">{r.occupancyType || 'Family'}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{r.moveInDate || 'Immediate'}</td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                      {r.isVerifiedManually ? '100% (Verified)' : r.extractionConfidence ? `${Math.round(r.extractionConfidence * 100)}% (AI)` : '100% (Manual)'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Requirement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <span>Add Customer Requirement</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Customer Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.customerPhoneRaw}
                    onChange={(e) => setFormData({ ...formData, customerPhoneRaw: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Customer Name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Property Type</label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="APARTMENT">Apartment</option>
                    <option value="VILLA">Villa</option>
                    <option value="STUDIO">Studio</option>
                    <option value="COMMERCIAL">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Minimum BHK</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minBedrooms}
                    onChange={(e) => setFormData({ ...formData, minBedrooms: parseInt(e.target.value) || 1 })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Occupancy Type</label>
                  <select
                    value={formData.occupancyType}
                    onChange={(e) => setFormData({ ...formData, occupancyType: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="FAMILY">Family</option>
                    <option value="BACHELOR">Bachelor</option>
                    <option value="COMPANY">Company Lease</option>
                    <option value="ANY">Any</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Preferred Locations</label>
                  <input
                    type="text"
                    placeholder="e.g. Whitefield, Marathahalli"
                    value={formData.preferredLocations}
                    onChange={(e) => setFormData({ ...formData, preferredLocations: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Furnishing</label>
                  <select
                    value={formData.furnishingStatus}
                    onChange={(e) => setFormData({ ...formData, furnishingStatus: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="SEMI_FURNISHED">Semi-Furnished</option>
                    <option value="FURNISHED">Fully Furnished</option>
                    <option value="UNFURNISHED">Unfurnished</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Min Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="20000"
                    value={formData.minBudget}
                    onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Max Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={formData.maxBudget}
                    onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Move-In Date</label>
                  <input
                    type="date"
                    value={formData.moveInDate}
                    onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Special Requirements</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Gated community, covered car parking..."
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
