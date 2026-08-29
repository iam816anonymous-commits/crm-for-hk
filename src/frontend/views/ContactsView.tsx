import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Phone, Mail, User, Plus, Trash2, Edit2, X } from 'lucide-react';
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    phoneRaw: '',
    firstName: '',
    lastName: '',
    email: '',
    address: '',
  });

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

  const openCreateModal = () => {
    setEditingContact(null);
    setFormData({ phoneRaw: '', firstName: '', lastName: '', email: '', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    setEditingContact(contact);
    setFormData({
      phoneRaw: contact.phoneNormalized || contact.phoneRaw,
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      address: contact.address || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchContacts(searchQuery);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete contact');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting contact');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingContact ? `/api/contacts/${editingContact.id}` : '/api/contacts';
      const method = editingContact ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchContacts(searchQuery);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save contact');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving contact');
    }
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
        <Button onClick={openCreateModal} variant="primary" icon={Plus}>
          Add Contact
        </Button>
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
            description="No contacts recorded yet. Add your first customer contact using the button above."
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

                  <div className="flex items-center space-x-2 self-end md:self-auto">
                    <button
                      onClick={(e) => openEditModal(e, contact)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Contact"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, contact.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingContact ? 'Edit Contact' : 'Create New Contact'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <Input
                  placeholder="+919876543210"
                  value={formData.phoneRaw}
                  onChange={(e) => setFormData({ ...formData, phoneRaw: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name</label>
                  <Input
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <Input
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address</label>
                <Input
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingContact ? 'Save Changes' : 'Create Contact'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
