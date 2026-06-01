import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, Client, CommissionEarning } from '../lib/api';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Wallet,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalClients: 0,
    targetAmount: 0,
    progressPercentage: 0,
    paymentsCount: 0,
  });
  const [recentEarnings, setRecentEarnings] = useState<CommissionEarning[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [teamStats, setTeamStats] = useState<
    Array<{ id: string; name: string; role: string; earnings: number; clients: number }>
  >([]);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    setLoading(true);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    try {
      // Fetch monthly target for this role
      const targetRole = profile.role === 'admin' ? 'boss' : profile.role;
      const targets = await api.targets.list(currentMonth, currentYear);
      const targetData = targets.find((t) => t.role === targetRole);

      const targetAmount = targetData?.target_amount || (profile.role === 'employee' ? 80000 : 150000);

      // Fetch current month earnings for this user
      const earningsData = await api.earnings.list({
        userId: profile.id,
        month: currentMonth,
        year: currentYear,
      });

      // Fetch clients (the backend scopes by role: employees see only their own)
      const clientsData = await api.clients.list();
      const clientsCount = clientsData.length;

      // Calculate total earnings
      const totalEarnings = earningsData.reduce((sum, e) => sum + Number(e.commission_amount), 0);
      const progressPercentage = targetAmount > 0 ? Math.min((totalEarnings / targetAmount) * 100, 100) : 0;

      setStats({
        totalEarnings,
        totalClients: clientsCount,
        targetAmount,
        progressPercentage,
        paymentsCount: earningsData.length,
      });

      setRecentEarnings(earningsData.slice(0, 5));
      setRecentClients(clientsData.slice(0, 5));

      // Fetch team stats for admin and bosses
      if (profile.role === 'admin' || profile.role === 'boss') {
        await fetchTeamStats(currentMonth, currentYear);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamStats = async (month: number, year: number) => {
    try {
      // Get all active profiles
      const profilesData = await api.profiles.list(true);

      // Get earnings for all users this month
      const allEarnings = await api.earnings.list({ month, year });

      // Get all clients (admin/boss see the full list)
      const allClients = await api.clients.list();

      const earningsMap = allEarnings.reduce((acc, e) => {
        acc[e.user_id] = (acc[e.user_id] || 0) + Number(e.commission_amount);
        return acc;
      }, {} as Record<string, number>);

      const clientsMap = allClients.reduce((acc, c) => {
        if (c.current_handler_id) {
          acc[c.current_handler_id] = (acc[c.current_handler_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const teamData = profilesData
        .filter((p) => p.role !== 'admin')
        .map((p) => ({
          id: p.id,
          name: p.full_name || p.email,
          role: p.role,
          earnings: earningsMap[p.id] || 0,
          clients: clientsMap[p.id] || 0,
        }))
        .sort((a, b) => b.earnings - a.earnings);

      setTeamStats(teamData);
    } catch (error) {
      console.error('Error fetching team stats:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {profile?.full_name || 'User'}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <Calendar className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium text-gray-700">
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Earnings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            {stats.progressPercentage >= 100 ? (
              <div className="flex items-center gap-1 text-emerald-500">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Target Hit!</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-500">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">In Progress</span>
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Total Earnings</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalEarnings)}</p>
          </div>
        </div>

        {/* Target */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Monthly Target</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.targetAmount)}</p>
          </div>
        </div>

        {/* Clients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">{profile?.role === 'employee' ? 'My Clients' : 'Total Clients'}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalClients}</p>
          </div>
        </div>

        {/* Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Payments This Month</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.paymentsCount}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Target Progress</h3>
          <span className="text-sm font-medium text-emerald-600">
            {stats.progressPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="relative">
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-out rounded-full ${
                stats.progressPercentage >= 100
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  : stats.progressPercentage >= 75
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                  : 'bg-gradient-to-r from-blue-400 to-cyan-500'
              }`}
              style={{ width: `${stats.progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>{formatCurrency(0)}</span>
            <span>{formatCurrency(stats.targetAmount)}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Earnings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Earnings</h3>
          {recentEarnings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No earnings this month</p>
          ) : (
            <div className="space-y-3">
              {recentEarnings.map((earning) => (
                <div
                  key={earning.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {earning.commission_type === 'primary' ? 'Primary' : 'Secondary'} Commission
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(earning.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-emerald-600">
                    +{formatCurrency(Number(earning.commission_amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Clients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Clients</h3>
          {recentClients.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No clients found</p>
          ) : (
            <div className="space-y-3">
              {recentClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Performance (Admin/Boss Only) */}
      {(profile?.role === 'admin' || profile?.role === 'boss') && teamStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">Team Members</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Clients</th>
                  <th className="pb-3 font-medium text-right">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teamStats.map((member) => (
                  <tr key={member.id} className="text-sm hover:bg-gray-50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          member.role === 'boss'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 text-gray-600">{member.clients}</td>
                    <td className="py-4 text-right font-semibold text-emerald-600">
                      {formatCurrency(member.earnings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
