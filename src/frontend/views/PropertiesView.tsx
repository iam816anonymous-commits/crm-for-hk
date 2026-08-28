import React, { useState } from 'react';
import { Home, Plus, X, Building2, CheckCircle2 } from 'lucide-react';

export default function PropertiesView() {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    ownerPhoneRaw: '',
    ownerName: '',
    title: '',
    propertyType: 'APARTMENT',
    listingType: 'RENT',
    bedrooms: 2,
    city: 'Whitefield, Bangalore',
    address: '',
    monthlyRent: '',
    depositAmount: '',
    maintenanceAmount: '',
    furnishingStatus: 'SEMI_FURNISHED',
    availableFrom: new Date().toISOString().split('T')[0],
    description: '',
    status: 'AVAILABLE',
  });

  const [propertiesList, setPropertiesList] = useState([
    {
      id: 'prop-1',
      title: 'Modern 2BHK Apartment in Whitefield',
      owner: 'ANITA SHARMA (+91 98123 45678)',
      type: 'APARTMENT',
      listing: 'RENT',
      rent: '₹25,000 / mo',
      deposit: '₹1,000,000',
      maintenance: '₹3,000 / mo',
      furnishing: 'Semi-Furnished',
      availableFrom: 'Immediate',
      status: 'AVAILABLE',
      address: 'Prestige Shantiniketan, Whitefield, Bangalore',
    },
    {
      id: 'prop-2',
      title: 'Luxury 3BHK Villa with Private Garden',
      owner: 'RAJESH GUPTA (+91 97111 22233)',
      type: 'VILLA',
      listing: 'RENT',
      rent: '₹55,000 / mo',
      deposit: '₹2,500,000',
      maintenance: '₹6,000 / mo',
      furnishing: 'Fully Furnished',
      availableFrom: '2026-09-01',
      status: 'OCCUPIED',
      address: 'Adarsh Palm Meadows, Whitefield, Bangalore',
    },
    {
      id: 'prop-3',
      title: 'Compact 1BHK Studio near Tech Park',
      owner: 'SURESH PATEL (+91 97654 32109)',
      type: 'STUDIO',
      listing: 'RENT',
      rent: '₹18,000 / mo',
      deposit: '₹75,000',
      maintenance: '₹1,500 / mo',
      furnishing: 'Unfurnished',
      availableFrom: 'Immediate',
      status: 'AVAILABLE',
      address: 'ITPL Main Road, Whitefield, Bangalore',
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProp = {
      id: `prop-${Date.now()}`,
      title: formData.title,
      owner: `${formData.ownerName || 'Property Owner'} (${formData.ownerPhoneRaw || '+91 98000 00000'})`,
      type: formData.propertyType,
      listing: formData.listingType,
      rent: `₹${Number(formData.monthlyRent || 25000).toLocaleString('en-IN')} / mo`,
      deposit: `₹${Number(formData.depositAmount || 100000).toLocaleString('en-IN')}`,
      maintenance: `₹${Number(formData.maintenanceAmount || 2000).toLocaleString('en-IN')} / mo`,
      furnishing: formData.furnishingStatus,
      availableFrom: formData.availableFrom || 'Immediate',
      status: formData.status,
      address: `${formData.address}, ${formData.city}`,
    };

    setPropertiesList([newProp, ...propertiesList]);
    setShowAddModal(false);
  };

  const filtered = propertiesList.filter((p) => filterStatus === 'ALL' || p.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((prop) => (
          <div key={prop.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${prop.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}`}>
                {prop.status}
              </span>
              <span className="text-xs font-mono font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                {prop.type} • {prop.listing}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base">{prop.title}</h3>
            <p className="text-xs text-gray-500">{prop.address}</p>
            <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <div>
                <span className="text-gray-400 block">Deposit</span>
                <span className="font-semibold text-gray-800">{prop.deposit}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Maintenance</span>
                <span className="font-semibold text-gray-800">{prop.maintenance}</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Owner</p>
                <p className="text-xs font-medium text-gray-700">{prop.owner}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Monthly Rent</p>
                <p className="text-sm font-bold text-emerald-600">{prop.rent}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                    placeholder="e.g. Anita Sharma"
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
                  placeholder="e.g. Modern 2BHK Apartment in Prestige Shantiniketan"
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
                  <label className="text-xs font-semibold text-gray-700">Location / City</label>
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
                  placeholder="Tower 4 - 802, Prestige Shantiniketan, Main Rd"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="Spacious 2BHK with modular kitchen, balcony view..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow"
                >
                  Save Property Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
