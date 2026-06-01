import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, Payment, Client } from '../lib/api';
import {
  Plus,
  Search,
  DollarSign,
  Calendar,
  User,
  X,
  TrendingUp,
  AlertCircle,
  FileText,
} from 'lucide-react';
import PaymentReceipt from '../components/PaymentReceipt';

export default function Payments() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [commissionSettings, setCommissionSettings] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchClients();
    fetchCommissionSettings();
  }, [profile]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // The backend scopes results by role (employees see only payments they handled).
      const data = await api.payments.list();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await api.clients.list();
      setClients(data.filter((c) => c.status === 'active'));
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchCommissionSettings = async () => {
    try {
      const data = await api.settings.list();
      const settingsMap = data.reduce((acc, s) => {
        acc[s.setting_name] = Number(s.setting_value);
        return acc;
      }, {} as Record<string, number>);
      setCommissionSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching commission settings:', error);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const amount = parseFloat(formData.amount);
      const client = clients.find((c) => c.id === formData.client_id);

      if (!client) {
        alert('Please select a client');
        return;
      }

      // The backend computes the received amount and the commission split, and
      // persists the commission earnings.
      await api.payments.create({
        client_id: formData.client_id,
        amount,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        notes: formData.notes,
      });

      setShowAddModal(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment');
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      notes: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.handler?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClient = clients.find((c) => c.id === formData.client_id);
  const previewAmount = formData.amount ? parseFloat(formData.amount) : 0;
  const previewReceived = previewAmount * ((commissionSettings['received_percentage'] || 90) / 100);

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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Track client payments and commissions</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Payment
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search payments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Commission Info */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Commission Structure</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>- Received Amount: {commissionSettings['received_percentage'] || 90}% (after {100 - (commissionSettings['received_percentage'] || 90)}% deduction)</li>
              <li>- Employee handled: {commissionSettings['employee_commission'] || 30}% to employee, {100 - (commissionSettings['employee_commission'] || 30)}% split between bosses (50-50)</li>
              <li>- Boss handled: 100% to boss</li>
              <li>- Client transfer: Previous handler gets {commissionSettings['handler_transfer_previous'] || 20}%, new handler gets {commissionSettings['handler_transfer_new'] || 80}%</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No payments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-sm text-gray-600">
                  <th className="font-semibold px-6 py-4">Date</th>
                  <th className="font-semibold px-6 py-4">Client</th>
                  <th className="font-semibold px-6 py-4">Handler</th>
                  <th className="font-semibold px-6 py-4 text-right">Amount</th>
                  <th className="font-semibold px-6 py-4 text-right">Received</th>
                  <th className="font-semibold px-6 py-4">Method</th>
                  <th className="font-semibold px-6 py-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-semibold">
                          {payment.client?.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <span className="font-medium text-gray-900">{payment.client?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {payment.handler?.full_name || 'Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-gray-900">{formatCurrency(Number(payment.amount))}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-emerald-600">{formatCurrency(Number(payment.received_amount))}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium capitalize">
                        {payment.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowReceiptModal(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add Payment</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.current_handler ? `- ${client.current_handler.full_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Payment Method</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              {/* Commission Preview */}
              {selectedClient && previewAmount > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-900">Commission Preview</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Amount:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(previewAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Received ({commissionSettings['received_percentage'] || 90}%):</span>
                      <span className="font-semibold text-emerald-700">{formatCurrency(previewReceived)}</span>
                    </div>
                    <div className="border-t border-emerald-200 pt-2 mt-2">
                      <p className="text-xs text-gray-500 mb-2">
                        Handler: {selectedClient?.current_handler?.full_name || 'Unassigned'} ({selectedClient?.current_handler?.role || 'N/A'})
                      </p>
                      {selectedClient?.current_handler?.role === 'employee' ? (
                        <>
                          <div className="flex justify-between text-emerald-700">
                            <span>- Employee ({commissionSettings['employee_commission'] || 30}%):</span>
                            <span className="font-medium">{formatCurrency((previewReceived * (commissionSettings['employee_commission'] || 30)) / 100)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-700 mt-1">
                            <span>- Each Boss ({((100 - (commissionSettings['employee_commission'] || 30)) / 2).toFixed(1)}%):</span>
                            <span className="font-medium">{formatCurrency((previewReceived * ((100 - (commissionSettings['employee_commission'] || 30)) / 2)) / 100)}</span>
                          </div>
                        </>
                      ) : selectedClient?.current_handler?.role === 'boss' ? (
                        <div className="flex justify-between text-emerald-700">
                          <span>- Boss (100%):</span>
                          <span className="font-medium">{formatCurrency(previewReceived)}</span>
                        </div>
                      ) : (
                        <p className="text-gray-500">No handler assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all"
              >
                Add Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <PaymentReceipt payment={selectedPayment} onClose={() => setShowReceiptModal(false)} />
      )}
    </div>
  );
}
