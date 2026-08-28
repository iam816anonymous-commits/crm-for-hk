import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Phone, Filter } from 'lucide-react';

export default function ContactsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const mockContacts = [
    {
      id: 'ravi-kumar-demo',
      name: 'RAVI KUMAR',
      phone: '+91 98765 43210',
      role: 'Tenant',
      requirement: '2BHK, Whitefield, ₹25,000',
      lastContact: 'Today',
      nextFollowUp: 'Tomorrow',
      whatsapp: 12,
      calls: 4,
      visits: 2,
    },
    {
      id: 'anita-sharma',
      name: 'ANITA SHARMA',
      phone: '+91 98123 45678',
      role: 'Owner',
      requirement: 'Owner - 3BHK Indiranagar',
      lastContact: '2 days ago',
      nextFollowUp: 'In 3 days',
      whatsapp: 8,
      calls: 2,
      visits: 1,
    },
    {
      id: 'suresh-patel',
      name: 'SURESH PATEL',
      phone: '+91 97654 32109',
      role: 'Buyer',
      requirement: '3BHK Villa, Sarjapur, ₹1.5 Cr',
      lastContact: 'Yesterday',
      nextFollowUp: 'Today',
      whatsapp: 15,
      calls: 6,
      visits: 3,
    },
  ];

  const filteredContacts = mockContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500">Canonical customer & owner directory</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow">
          <Plus className="w-4 h-4" />
          <span>Add Contact</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by phone (+91XXXXXXXXXX) or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <button className="flex items-center space-x-2 border border-gray-300 bg-white px-3.5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Filter className="w-4 h-4 text-gray-500" />
          <span>Filter Roles</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-3.5">Contact Name</th>
              <th className="px-6 py-3.5">Role</th>
              <th className="px-6 py-3.5">Phone</th>
              <th className="px-6 py-3.5">Requirements / Listing</th>
              <th className="px-6 py-3.5">Interactions</th>
              <th className="px-6 py-3.5">Last Contact</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredContacts.map((contact) => (
              <tr
                key={contact.id}
                onClick={() => navigate(`/contacts/${contact.id}`)}
                className="hover:bg-blue-50/50 cursor-pointer transition"
              >
                <td className="px-6 py-4 font-semibold text-gray-900">{contact.name}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {contact.role}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-gray-700">{contact.phone}</td>
                <td className="px-6 py-4 text-gray-600">{contact.requirement}</td>
                <td className="px-6 py-4 text-xs space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">WA: {contact.whatsapp}</span>
                  <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-medium">Calls: {contact.calls}</span>
                </td>
                <td className="px-6 py-4 text-gray-500">{contact.lastContact}</td>
                <td className="px-6 py-4 text-right">
                  <span className="text-blue-600 font-medium text-sm hover:underline">View Profile &rarr;</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
