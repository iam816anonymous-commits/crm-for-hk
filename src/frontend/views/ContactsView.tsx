import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Phone, Mail, User } from 'lucide-react';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';
import { ProvenanceBadge } from '../components/ProvenanceBadge.js';
import { EmptyState, LoadingState, ErrorState } from '../components/States.js';

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
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const navigate = useNavigate();

  useEffect(() => {
    fetchContacts(initialSearch);
  }, [initialSearch]);

  const fetchContacts = async (query: string) => {
    setLoading(true);
    setError(null);
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
      } else {
        setError('Failed to load contacts from server');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching contacts');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Canonical Contacts Ledger</h1>
          <p className="text-xs text-slate-500">
            Deduplicated canonical customer profiles normalized to E.164 standards.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl shadow-2xs border border-slate-200">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="flex-1">
            <Input
              icon={Search}
              placeholder="Search contacts by phone (+91XXXXXXXXXX) or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>
      </div>

      {error && <ErrorState message={error} onRetry={() => fetchContacts(searchQuery)} />}

      {/* Contacts List */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
        {loading ? (
          <LoadingState message="Searching canonical contacts..." />
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={User}
            title="No contacts found"
            description="Contacts are automatically populated from inbound WhatsApp messages, call logs, and manual entries."
          />
        ) : (
          <div className="divide-y divide-slate-200">
            {contacts.map((contact) => {
              const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.phoneNormalized;
              return (
                <div
                  key={contact.id}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                  className="p-4 hover:bg-slate-50 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm flex-shrink-0">
                      {fullName[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-slate-900 text-sm">{fullName}</h3>
                        <ProvenanceBadge isVerifiedManually={contact.isVerifiedManually} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="flex items-center font-mono">
                          <Phone className="w-3 h-3 mr-1 text-slate-400" />
                          {contact.phoneNormalized}
                        </span>
                        {contact.email && (
                          <span className="flex items-center">
                            <Mail className="w-3 h-3 mr-1 text-slate-400" />
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
