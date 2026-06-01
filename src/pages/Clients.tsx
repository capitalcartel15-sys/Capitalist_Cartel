import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, Client, Profile, ClientHandlerHistory, Payment } from '../lib/api';
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  Calendar,
  Edit3,
  UserCheck,
  History,
  X,
  AlertCircle,
  Trash2,
  ToggleLeft,
  ToggleRight,
  DollarSign,
} from 'lucide-react';

export default function Clients() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [handlerHistory, setHandlerHistory] = useState<ClientHandlerHistory[]>([]);
  const [clientPayments, setClientPayments] = useState<Payment[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
    current_handler_id: '',
  });

  const canManage = profile?.role === 'admin' || profile?.role === 'boss';

  useEffect(() => {
    fetchClients();
    fetchProfiles();
  }, [profile]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // The backend scopes results by role (employees see only their own clients).
      const data = await api.clients.list();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const data = await api.profiles.list(true);
      setProfiles(data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchHandlerHistory = async (clientId: string) => {
    try {
      const data = await api.clients.history(clientId);
      setHandlerHistory(data);
    } catch (error) {
      console.error('Error fetching handler history:', error);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('You do not have permission to add clients');
      return;
    }

    try {
      await api.clients.create({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        notes: formData.notes,
        status: formData.status,
        current_handler_id: formData.current_handler_id || undefined,
      });

      setShowAddModal(false);
      resetForm();
      fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client: ' + (error as Error).message);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !selectedClient) return;

    try {
      await api.clients.update(selectedClient.id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        notes: formData.notes,
        status: formData.status,
      });

      setShowEditModal(false);
      resetForm();
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Failed to update client');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      await api.clients.remove(clientId);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client');
    }
  };

  const handleToggleStatus = async (clientId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      await api.clients.update(clientId, { status: newStatus as Client['status'] });
      fetchClients();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update client status');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !selectedClient) return;

    const newHandlerId = formData.current_handler_id;
    const previousHandlerId = selectedClient.current_handler_id;

    if (newHandlerId === previousHandlerId) {
      alert('Please select a different handler');
      return;
    }

    try {
      // The backend records the handler-history row (with the configured transfer
      // commission split) and updates the client's current handler.
      await api.clients.transfer(selectedClient.id, newHandlerId || null);

      setShowTransferModal(false);
      resetForm();
      fetchClients();
    } catch (error) {
      console.error('Error transferring client:', error);
      alert('Failed to transfer client');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      notes: '',
      status: 'active',
      current_handler_id: '',
    });
    setSelectedClient(null);
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      notes: client.notes || '',
      status: client.status,
      current_handler_id: client.current_handler_id || '',
    });
    setShowEditModal(true);
  };

  const openTransferModal = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      ...formData,
      current_handler_id: client.current_handler_id || '',
    });
    setShowTransferModal(true);
  };

  const openHistoryModal = (client: Client) => {
    setSelectedClient(client);
    fetchHandlerHistory(client.id);
    fetchClientPayments(client.id);
    setShowHistoryModal(true);
  };

  const fetchClientPayments = async (clientId: string) => {
    try {
      const data = await api.clients.payments(clientId);
      setClientPayments(data);
    } catch (error) {
      console.error('Error fetching client payments:', error);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">Manage your client database</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Client
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No clients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-lg">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{client.name}</h3>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        client.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : client.status === 'inactive'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {client.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-gray-400" />
                  <span>
                    {client.current_handler?.full_name || 'No handler assigned'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Added {new Date(client.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                {/* Status Toggle */}
                <button
                  onClick={() => handleToggleStatus(client.id, client.status)}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    client.status === 'active'
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      : 'bg-red-50 hover:bg-red-100 text-red-700'
                  }`}
                >
                  {client.status === 'active' ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      Active - Click to Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Inactive - Click to Activate
                    </>
                  )}
                </button>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {canManage && (
                    <>
                      <button
                        onClick={() => openEditModal(client)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => openTransferModal(client)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        Transfer
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openHistoryModal(client)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors"
                  >
                    <DollarSign className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <Modal title="Add New Client" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddClient} className="space-y-4">
            <InputField label="Name" required value={formData.name} onChange={(val) => setFormData({ ...formData, name: val })} />
            <InputField label="Phone" value={formData.phone} onChange={(val) => setFormData({ ...formData, phone: val })} type="tel" />
            <InputField label="Email" value={formData.email} onChange={(val) => setFormData({ ...formData, email: val })} type="email" />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Assign Handler</label>
              <select
                value={formData.current_handler_id}
                onChange={(e) => setFormData({ ...formData, current_handler_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">No handler</option>
                {profiles.filter((p) => p.role !== 'admin').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email} ({p.role})
                  </option>
                ))}
              </select>
            </div>
            <TextAreaField label="Notes" value={formData.notes} onChange={(val) => setFormData({ ...formData, notes: val })} />
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all">
              Add Client
            </button>
          </form>
        </Modal>
      )}

      {/* Edit Client Modal */}
      {showEditModal && (
        <Modal title="Edit Client" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleUpdateClient} className="space-y-4">
            <InputField label="Name" required value={formData.name} onChange={(val) => setFormData({ ...formData, name: val })} />
            <InputField label="Phone" value={formData.phone} onChange={(val) => setFormData({ ...formData, phone: val })} type="tel" />
            <InputField label="Email" value={formData.email} onChange={(val) => setFormData({ ...formData, email: val })} type="email" />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <TextAreaField label="Notes" value={formData.notes} onChange={(val) => setFormData({ ...formData, notes: val })} />
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all">
              Update Client
            </button>
          </form>
        </Modal>
      )}

      {/* Transfer Client Modal */}
      {showTransferModal && (
        <Modal title="Transfer Client" onClose={() => setShowTransferModal(false)}>
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium mb-1">Commission Split on Transfer</p>
                <p>Previous handler will receive 20% commission.</p>
                <p>New handler will receive 80% commission.</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Current Handler</label>
              <input
                type="text"
                disabled
                value={selectedClient?.current_handler?.full_name || 'No handler'}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">New Handler</label>
              <select
                value={formData.current_handler_id}
                onChange={(e) => setFormData({ ...formData, current_handler_id: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Select handler</option>
                {profiles.filter((p) => p.role !== 'admin').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email} ({p.role})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all">
              Transfer Client
            </button>
          </form>
        </Modal>
      )}

      {/* Handler History and Payments Modal */}
      {showHistoryModal && (
        <Modal title={`${selectedClient?.name} - History & Payments`} onClose={() => setShowHistoryModal(false)}>
          <div className="space-y-6">
            {/* Payments Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Payment History
              </h3>
              {clientPayments.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No payments recorded</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {clientPayments.map((payment) => (
                    <div key={payment.id} className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-sm font-semibold text-emerald-600">
                          ₹{Number(payment.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Received: ₹{Number(payment.received_amount).toLocaleString('en-IN')} (90%)
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{payment.payment_method}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Handler Changes Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Handler Changes
              </h3>
              {handlerHistory.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No handler changes recorded</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {handlerHistory.map((history) => (
                    <div key={history.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(history.change_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">From:</span> {history.previous_handler?.full_name || 'Unassigned'}
                      </p>
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">To:</span> {history.new_handler?.full_name || 'Unassigned'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
      />
    </div>
  );
}
