import React, { useState, useEffect } from 'react';
import { Home, Plus, X } from 'lucide-react';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';
import { Badge } from '../components/Badge.js';
import { EmptyState, LoadingState, ErrorState } from '../components/States.js';

export default function PropertiesView() {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [propertiesList, setPropertiesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    ownerPhoneRaw: '',
    ownerName: '',
    title: '',
    propertyType: 'APARTMENT',
    listingType: 'RENT',
    bedrooms: 2,
    city: 'Bangalore',
    address: '',
    monthlyRent: '25000',
    depositAmount: '100000',
    maintenanceAmount: '2000',
    furnishingStatus: 'SEMI_FURNISHED',
    availableFrom: new Date().toISOString().split('T')[0],
    description: '',
    status: 'AVAILABLE',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/properties', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPropertiesList(data.data || []);
      } else {
        setError('Failed to fetch property listings');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ownerPhoneRaw: formData.ownerPhoneRaw,
          ownerName: formData.ownerName,
          title: formData.title,
          propertyType: formData.propertyType,
          listingType: formData.listingType,
          bedrooms: Number(formData.bedrooms),
          city: formData.city,
          address: formData.address,
          monthlyRent: Number(formData.monthlyRent),
          depositAmount: Number(formData.depositAmount),
          maintenanceAmount: Number(formData.maintenanceAmount),
          furnishingStatus: formData.furnishingStatus,
          availableFrom: formData.availableFrom,
          description: formData.description,
          status: formData.status,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchProperties();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create property listing');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting property');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = propertiesList.filter((p) => filterStatus === 'ALL' || p.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Properties Inventory</h1>
          <p className="text-xs text-slate-500">Real estate listing inventory & owner management</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Property
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-md transition ${filterStatus === 'ALL' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            All ({propertiesList.length})
          </button>
          <button
            onClick={() => setFilterStatus('AVAILABLE')}
            className={`px-3 py-1.5 rounded-md transition ${filterStatus === 'AVAILABLE' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Available
          </button>
          <button
            onClick={() => setFilterStatus('OCCUPIED')}
            className={`px-3 py-1.5 rounded-md transition ${filterStatus === 'OCCUPIED' ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Occupied
          </button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={fetchProperties} />}

      {loading ? (
        <LoadingState message="Loading property listings inventory..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No properties found"
          description="Add your first property listing to populate your organization's inventory."
          actionText="Add Property Listing"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filtered.map((prop) => (
            <div key={prop.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3 hover:shadow-xs transition">
              <div className="flex items-start justify-between">
                <Badge variant={prop.status === 'AVAILABLE' ? 'success' : 'neutral'}>
                  {prop.status}
                </Badge>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {prop.propertyType} • {prop.listingType}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{prop.title}</h3>
              <p className="text-xs text-slate-500">{prop.address}, {prop.city}</p>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Deposit</span>
                  <span className="font-semibold text-slate-800 font-mono">₹{prop.depositAmount?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Maintenance</span>
                  <span className="font-semibold text-slate-800 font-mono">₹{prop.maintenanceAmount?.toLocaleString('en-IN') || 0} / mo</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Furnishing</p>
                  <p className="text-xs font-medium text-slate-700">{prop.furnishingStatus}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Monthly Rent</p>
                  <p className="text-xs font-bold text-emerald-700 font-mono">₹{prop.monthlyRent?.toLocaleString('en-IN') || 0} / mo</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Home className="w-5 h-5 text-emerald-600" />
                <span>Add Property Listing</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Owner Phone Number *"
                  required
                  placeholder="+91 98123 45678"
                  value={formData.ownerPhoneRaw}
                  onChange={(e) => setFormData({ ...formData, ownerPhoneRaw: e.target.value })}
                />
                <Input
                  label="Owner Name"
                  placeholder="e.g. Property Owner"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                />
              </div>

              <Input
                label="Property Title *"
                required
                placeholder="e.g. Modern 2BHK Apartment in Whitefield"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

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
                  label="BHK (Bedrooms)"
                  type="number"
                  min="1"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 1 })}
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
                  label="Monthly Rent (₹)"
                  type="number"
                  placeholder="25000"
                  value={formData.monthlyRent}
                  onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                />
                <Input
                  label="Deposit (₹)"
                  type="number"
                  placeholder="100000"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                />
                <Input
                  label="Maintenance (₹)"
                  type="number"
                  placeholder="3000"
                  value={formData.maintenanceAmount}
                  onChange={(e) => setFormData({ ...formData, maintenanceAmount: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City / Location"
                  placeholder="Whitefield, Bangalore"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input
                  label="Available From"
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                />
              </div>

              <Input
                label="Full Address"
                placeholder="Prestige Shantiniketan, Whitefield Main Rd"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />

              <div className="flex justify-end space-x-3 border-t border-slate-200 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={submitting}>
                  Save Property Listing
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
