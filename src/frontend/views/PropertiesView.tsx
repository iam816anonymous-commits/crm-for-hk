import React, { useState } from 'react';
import { Home, Plus, Search, Filter, CheckCircle2, Building2 } from 'lucide-react';

export default function PropertiesView() {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const propertiesList = [
    {
      id: 'prop-1',
      title: 'Modern 2BHK Apartment in Whitefield',
      owner: 'ANITA SHARMA (+91 98123 45678)',
      type: 'APARTMENT',
      listing: 'RENT',
      rent: '₹25,000 / mo',
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
      status: 'AVAILABLE',
      address: 'ITPL Main Road, Whitefield, Bangalore',
    },
  ];

  const filtered = propertiesList.filter((p) => filterStatus === 'ALL' || p.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500">Real estate listing inventory and owner management</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow">
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
            All (3)
          </button>
          <button
            onClick={() => setFilterStatus('AVAILABLE')}
            className={`px-3 py-1.5 rounded-md ${filterStatus === 'AVAILABLE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Available (2)
          </button>
          <button
            onClick={() => setFilterStatus('OCCUPIED')}
            className={`px-3 py-1.5 rounded-md ${filterStatus === 'OCCUPIED' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Occupied (1)
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
                {prop.listing}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base">{prop.title}</h3>
            <p className="text-xs text-gray-500">{prop.address}</p>
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Owner</p>
                <p className="text-xs font-medium text-gray-700">{prop.owner}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Rent</p>
                <p className="text-sm font-bold text-emerald-600">{prop.rent}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
