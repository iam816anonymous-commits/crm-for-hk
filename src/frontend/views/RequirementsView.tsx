import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, X } from 'lucide-react';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';
import { ProvenanceBadge } from '../components/ProvenanceBadge.js';
import { EmptyState, LoadingState, ErrorState } from '../components/States.js';

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
        setError('Failed to fetch requirements from server');
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
          <h1 className="text-xl font-bold text-slate-900 font-sans">Requirements Ledger</h1>
          <p className="text-xs text-slate-500">Tenant and buyer criteria captured manually or via AI intelligence</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Requirement
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={fetchRequirements} />}

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <LoadingState message="Loading requirements ledger..." />
        ) : reqs.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No active requirements"
            description="Capture tenant criteria manually or receive inbound WhatsApp enquiries."
            actionText="Add Requirement"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-5 py-3">Intent / Type</th>
                <th className="px-5 py-3">Min BHK</th>
                <th className="px-5 py-3">Preferred Locations</th>
                <th className="px-5 py-3">Max Budget</th>
                <th className="px-5 py-3">Occupancy</th>
                <th className="px-5 py-3">Move-In Date</th>
                <th className="px-5 py-3">Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reqs.map((r) => {
                let locations = [];
                try {
                  locations = r.preferredLocations ? JSON.parse(r.preferredLocations) : [];
                } catch {
                  locations = [r.preferredLocations];
                }

                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{r.intent} • {r.propertyType}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium font-mono">{r.minBedrooms ? `${r.minBedrooms}BHK` : 'N/A'}</td>
                    <td className="px-5 py-3.5 text-slate-700">{locations.join(', ') || 'Any'}</td>
                    <td className="px-5 py-3.5 font-bold text-emerald-700 font-mono">₹{r.maxBudget?.toLocaleString('en-IN') || 'N/A'}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full w-max">{r.occupancyType || 'Family'}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs font-mono">{r.moveInDate || 'Immediate'}</td>
                    <td className="px-5 py-3.5">
                      <ProvenanceBadge
                        confidence={r.extractionConfidence}
                        isVerifiedManually={r.isVerifiedManually}
                      />
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
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                <span>Add Customer Requirement</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Customer Phone Number *"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.customerPhoneRaw}
                  onChange={(e) => setFormData({ ...formData, customerPhoneRaw: e.target.value })}
                />
                <Input
                  label="Customer Name"
                  placeholder="e.g. Customer Name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Property Type</label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  >
                    <option value="APARTMENT">Apartment</option>
                    <option value="VILLA">Villa</option>
                    <option value="STUDIO">Studio</option>
                    <option value="COMMERCIAL">Commercial</option>
                  </select>
                </div>
                <Input
                  label="Minimum BHK"
                  type="number"
                  min="1"
                  value={formData.minBedrooms}
                  onChange={(e) => setFormData({ ...formData, minBedrooms: parseInt(e.target.value) || 1 })}
                />
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Occupancy Type</label>
                  <select
                    value={formData.occupancyType}
                    onChange={(e) => setFormData({ ...formData, occupancyType: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  >
                    <option value="FAMILY">Family</option>
                    <option value="BACHELOR">Bachelor</option>
                    <option value="COMPANY">Company Lease</option>
                    <option value="ANY">Any</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Preferred Locations"
                  placeholder="e.g. Whitefield, Marathahalli"
                  value={formData.preferredLocations}
                  onChange={(e) => setFormData({ ...formData, preferredLocations: e.target.value })}
                />
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Furnishing</label>
                  <select
                    value={formData.furnishingStatus}
                    onChange={(e) => setFormData({ ...formData, furnishingStatus: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900"
                  >
                    <option value="SEMI_FURNISHED">Semi-Furnished</option>
                    <option value="FURNISHED">Fully Furnished</option>
                    <option value="UNFURNISHED">Unfurnished</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Min Budget (₹)"
                  type="number"
                  placeholder="20000"
                  value={formData.minBudget}
                  onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
                />
                <Input
                  label="Max Budget (₹)"
                  type="number"
                  placeholder="25000"
                  value={formData.maxBudget}
                  onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
                />
                <Input
                  label="Move-In Date"
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 border-t border-slate-200 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={submitting}>
                  Save Requirement
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
