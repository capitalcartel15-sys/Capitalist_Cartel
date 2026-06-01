import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, CommissionSetting, Profile } from '../lib/api';
import {
  Target,
  Percent,
  Users,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

export default function Settings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commissionSettings, setCommissionSettings] = useState<CommissionSetting[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [targetForm, setTargetForm] = useState({
    employeeTarget: 80000,
    bossTarget: 150000,
  });

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const [settingsData, targetsData, profilesData] = await Promise.all([
        api.settings.list(),
        api.targets.list(currentMonth, currentYear),
        api.profiles.list(),
      ]);

      setCommissionSettings(settingsData);

      if (targetsData.length > 0) {
        const employeeTarget = targetsData.find((t) => t.role === 'employee');
        const bossTarget = targetsData.find((t) => t.role === 'boss');
        setTargetForm({
          employeeTarget: employeeTarget?.target_amount || 80000,
          bossTarget: bossTarget?.target_amount || 150000,
        });
      }

      setProfiles(profilesData);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (settingName: string, newValue: number) => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api.settings.update(settingName, newValue);

      setMessage('Commission setting updated successfully');
      fetchData();
    } catch (err) {
      setError('Failed to update setting');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTarget = async (role: 'employee' | 'boss', targetAmount: number) => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      await api.targets.upsert({
        role,
        target_amount: targetAmount,
        month: currentMonth,
        year: currentYear,
      });

      setMessage(`Monthly target for ${role} updated successfully`);
      fetchData();
    } catch (err) {
      setError('Failed to update target');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleMonthlyReset = async () => {
    if (!confirm('Are you sure you want to archive current month data and reset for the next month? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      // The backend archives every non-admin user's month and rolls targets forward.
      await api.admin.monthlyReset();

      setMessage('Monthly data archived successfully. Targets reset for next month.');
      fetchData();
    } catch (err) {
      setError('Failed to archive monthly data');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'boss' ? 'employee' : 'boss';
    if (!confirm(`Change user role to ${newRole}?`)) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api.profiles.update(userId, { role: newRole });

      setMessage('User role updated successfully');
      fetchData();
    } catch (err) {
      setError('Failed to update user role');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserActive = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    if (!confirm(`${newStatus ? 'Activate' : 'Deactivate'} user?`)) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api.profiles.update(userId, { is_active: newStatus });

      setMessage(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (err) {
      setError('Failed to update user status');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage commissions, targets, and system settings</p>
      </div>

      {/* Messages */}
      {message && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700">{message}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Monthly Reset */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Monthly Reset</h3>
              <p className="text-gray-500 text-sm mt-1">
                Archive current month data and create targets for next month
              </p>
              <p className="text-amber-600 text-sm mt-2">
                Current period: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={handleMonthlyReset}
            disabled={saving}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            Archive & Reset
          </button>
        </div>
      </div>

      {/* Monthly Targets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Monthly Targets</h3>
            <p className="text-sm text-gray-500">Set earnings targets for each role</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700 block">Employee Target</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={targetForm.employeeTarget}
                  onChange={(e) => setTargetForm({ ...targetForm, employeeTarget: parseInt(e.target.value) || 0 })}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <button
                onClick={() => handleUpdateTarget('employee', targetForm.employeeTarget)}
                disabled={saving}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700 block">Boss Target</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={targetForm.bossTarget}
                  onChange={(e) => setTargetForm({ ...targetForm, bossTarget: parseInt(e.target.value) || 0 })}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <button
                onClick={() => handleUpdateTarget('boss', targetForm.bossTarget)}
                disabled={saving}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Percent className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Commission Settings</h3>
            <p className="text-sm text-gray-500">Configure commission percentages</p>
          </div>
        </div>

        <div className="space-y-4">
          {commissionSettings.map((setting) => (
            <CommissionSettingRow
              key={setting.id}
              setting={setting}
              onSave={handleUpdateSetting}
              saving={saving}
            />
          ))}
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 flex items-center gap-3 border-b border-gray-200">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-500">Manage user roles and permissions</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-600">
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-semibold">
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-700'
                          : user.role === 'boss'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role !== 'admin' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleUserRole(user.id, user.role)}
                          disabled={saving}
                          className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          {user.role === 'boss' ? 'Make Employee' : 'Make Boss'}
                        </button>
                        <button
                          onClick={() => handleToggleUserActive(user.id, user.is_active)}
                          disabled={saving}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            user.is_active
                              ? 'bg-red-100 hover:bg-red-200 text-red-700'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                          }`}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CommissionSettingRow({
  setting,
  onSave,
  saving,
}: {
  setting: CommissionSetting;
  onSave: (name: string, value: number) => void;
  saving: boolean;
}) {
  const [value, setValue] = useState(setting.setting_value);

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900 capitalize">
          {setting.setting_name.replace(/_/g, ' ')}
        </p>
        <p className="text-sm text-gray-500">{setting.description}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            min="0"
            max="100"
            className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-right"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
        </div>
        <button
          onClick={() => onSave(setting.setting_name, value)}
          disabled={saving || value === setting.setting_value}
          className="px-3 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
