import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, UserPlus, Phone, Mail, CheckCircle2, User } from 'lucide-react';

export interface Contact {
  id: string;
  phoneRaw: string;
  phoneNormalized: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  address?: string;
  isVerifiedManually: boolean;
  createdAt: string;
}

export default function ContactsView() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const navigate = useNavigate();

  useEffect(() => {
    fetchContacts(initialSearch);
  }, [initialSearch]);

  const fetchContacts = async (query: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts(searchQuery);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canonical Contacts Ledger</h1>
          <p className="text-sm text-gray-500">
            Deduplicated canonical customer profiles normalized to E.164 standards.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search contacts by phone (+91XXXXXXXXXX) or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading contacts...
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-700">No contacts found</p>
            <p className="text-sm text-gray-500 mt-1">
              Contacts are automatically populated from inbound WhatsApp messages, calls, and manual entries.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {contacts.map((contact) => {
              const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.phoneNormalized;
              return (
                <div
                  key={contact.id}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                  className="p-5 hover:bg-slate-50 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-base flex-shrink-0">
                      {fullName[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 text-base">{fullName}</h3>
                        {contact.isVerifiedManually && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Phone className="w-3.5 h-3.5 mr-1 text-gray-400" />
                          {contact.phoneNormalized}
                        </span>
                        {contact.email && (
                          <span className="flex items-center">
                            <Mail className="w-3.5 h-3.5 mr-1 text-gray-400" />
                            {contact.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
