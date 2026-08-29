import React, { useState, useEffect } from 'react';
import { Home, Plus, X, AlertCircle, Building2 } from 'lucide-react';

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
        setError('Failed to fetch properties from server');
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
          <h1 className="text-2xl font-bold text-gray-900">Properties Inventory</h1>
          <p className="text-sm text-gray-500">Real estate listing inventory & owner management</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-white border border-gray-300 p-1.5 rounded-lg text-sm font-medium">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-md ${filterStatus === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            All ({propertiesList.length})
          </button>
          <button
            onClick={() => setFilterStatus('AVAILABLE')}
            className={`px-3 py-1.5 rounded-md ${filterStatus === 'AVAILABLE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Available
          </button>
          <button
            onClick={() => setFilterStatus('OCCUPIED')}
            className={`px-3 py-1.5 rounded-md ${filterStatus === 'OCCUPIED' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Occupied
          </button>
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
          Loading property inventory...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-700">No properties found</p>
          <p className="text-sm text-gray-500 mt-1">Add a new property listing to populate your organization's inventory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((prop) => (
            <div key={prop.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${prop.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}`}>
                  {prop.status}
                </span>
                <span className="text-xs font-mono font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {prop.propertyType} • {prop.listingType}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-base">{prop.title}</h3>
              <p className="text-xs text-gray-500">{prop.address}, {prop.city}</p>
              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <div>
                  <span className="text-gray-400 block">Deposit</span>
                  <span className="font-semibold text-gray-800">₹{prop.depositAmount?.toLocaleString('en-IN') || 0}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Maintenance</span>
                  <span className="font-semibold text-gray-800">₹{prop.maintenanceAmount?.toLocaleString('en-IN') || 0} / mo</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Furnishing</p>
                  <p className="text-xs font-medium text-gray-700">{prop.furnishingStatus}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Monthly Rent</p>
                  <p className="text-sm font-bold text-emerald-600">₹{prop.monthlyRent?.toLocaleString('en-IN') || 0} / mo</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Home className="w-5 h-5 text-blue-600" />
                <span>Add New Property Listing</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Owner Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98123 45678"
                    value={formData.ownerPhoneRaw}
                    onChange={(e) => setFormData({ ...formData, ownerPhoneRaw: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Owner Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Property Owner"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Property Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern 2BHK Apartment in Whitefield"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                />
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
                  <label className="text-xs font-semibold text-gray-700">BHK (Bedrooms)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 1 })}
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
                  <label className="text-xs font-semibold text-gray-700">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Deposit (₹)</label>
                  <input
                    type="number"
                    placeholder="100000"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Maintenance (₹)</label>
                  <input
                    type="number"
                    placeholder="3000"
                    value={formData.maintenanceAmount}
                    onChange={(e) => setFormData({ ...formData, maintenanceAmount: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700">City / Location</label>
                  <input
                    type="text"
                    placeholder="Whitefield, Bangalore"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Available From</label>
                  <input
                    type="date"
                    value={formData.availableFrom}
                    onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Full Address</label>
                <input
                  type="text"
                  placeholder="Prestige Shantiniketan, Whitefield Main Rd"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                />
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
                  {submitting ? 'Saving...' : 'Save Property Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
