import { useEffect, useState } from 'react';
import { api, Profile, CommissionEarning, MonthlyDataArchive, MonthlyTarget } from '../lib/api';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Target,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [earnings, setEarnings] = useState<CommissionEarning[]>([]);
  const [targets, setTargets] = useState<MonthlyTarget[]>([]);
  const [archives, setArchives] = useState<MonthlyDataArchive[]>([]);
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');

  useEffect(() => {
    fetchProfiles();
    fetchArchives();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, viewMode]);

  const fetchProfiles = async () => {
    try {
      const data = await api.profiles.list(true);
      setProfiles(data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchArchives = async () => {
    try {
      const data = await api.archives.list();
      setArchives(data);
    } catch (error) {
      console.error('Error fetching archives:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [targetData, earningsData] = await Promise.all([
        api.targets.list(selectedMonth, selectedYear),
        api.earnings.list({ month: selectedMonth, year: selectedYear }),
      ]);
      setTargets(targetData);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  // Calculate per-user analytics
  const userAnalytics = profiles
    .filter((p) => p.role !== 'admin')
    .map((user) => {
      const userEarnings = earnings.filter((e) => e.user_id === user.id);
      const totalEarnings = userEarnings.reduce((sum, e) => sum + Number(e.commission_amount), 0);
      const target = targets.find((t) => t.role === user.role);
      const targetAmount = target?.target_amount || (user.role === 'employee' ? 80000 : 150000);
      const progressPercentage = targetAmount > 0 ? (totalEarnings / targetAmount) * 100 : 0;

      return {
        user,
        totalEarnings,
        targetAmount,
        progressPercentage: Math.min(progressPercentage, 100),
        targetAchieved: totalEarnings >= targetAmount,
        earningsCount: userEarnings.length,
      };
    })
    .sort((a, b) => b.totalEarnings - a.totalEarnings);

  // Calculate overall stats
  const totalCompanyEarnings = earnings.reduce((sum, e) => sum + Number(e.commission_amount), 0);
  const totalPayments = new Set(earnings.map((e) => e.payment_id)).size;

  // Group earnings by date
  const earningsByDate = earnings.reduce((acc, earning) => {
    const date = new Date(earning.created_at).toLocaleDateString('en-IN');
    if (!acc[date]) {
      acc[date] = { date, total: 0, count: 0 };
    }
    acc[date].total += Number(earning.commission_amount);
    acc[date].count++;
    return acc;
  }, {} as Record<string, { date: string; total: number; count: number }>);

  if (loading && viewMode === 'current') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Performance insights and historical data</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('current')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'current'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Current Period
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'history'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Historical Data
          </button>
        </div>
      </div>

      {viewMode === 'current' ? (
        <>
          {/* Month Navigator */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <span className="text-lg font-semibold text-gray-900">
                {getMonthName(selectedMonth)} {selectedYear}
              </span>
            </div>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <DollarSign className="w-8 h-8 opacity-80" />
                <TrendingUp className="w-5 h-5 opacity-80" />
              </div>
              <div className="mt-4">
                <p className="text-sm opacity-80">Total Company Earnings</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalCompanyEarnings)}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <Target className="w-8 h-8 opacity-80" />
              </div>
              <div className="mt-4">
                <p className="text-sm opacity-80">Total Payments</p>
                <p className="text-3xl font-bold mt-1">{totalPayments}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <Users className="w-8 h-8 opacity-80" />
              </div>
              <div className="mt-4">
                <p className="text-sm opacity-80">Active Team Members</p>
                <p className="text-3xl font-bold mt-1">{profiles.filter((p) => p.role !== 'admin').length}</p>
              </div>
            </div>
          </div>

          {/* Team Performance Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Team Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-sm text-gray-600">
                    <th className="px-6 py-4 font-semibold">Team Member</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold">Earnings</th>
                    <th className="px-6 py-4 font-semibold">Target</th>
                    <th className="px-6 py-4 font-semibold">Progress</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {userAnalytics.map((analytics) => (
                    <tr key={analytics.user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                            {analytics.user.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{analytics.user.full_name || 'User'}</p>
                            <p className="text-xs text-gray-500">{analytics.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            analytics.user.role === 'boss'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {analytics.user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(analytics.totalEarnings)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatCurrency(analytics.targetAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium">{analytics.progressPercentage.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                analytics.targetAchieved
                                  ? 'bg-emerald-500'
                                  : analytics.progressPercentage >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${analytics.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {analytics.targetAchieved ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                            Achieved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-amber-600">
                            <TrendingUp className="w-4 h-4" />
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Earnings Chart */}
          {Object.keys(earningsByDate).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Earnings Overview</h3>
              <div className="space-y-3">
                {Object.values(earningsByDate)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map((dayData) => (
                    <div key={dayData.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{dayData.date}</span>
                        <span className="text-sm text-gray-500">({dayData.count} transactions)</span>
                      </div>
                      <span className="font-semibold text-emerald-600">
                        +{formatCurrency(dayData.total)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Historical Data View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Historical Monthly Data</h2>
            <p className="text-sm text-gray-500 mt-1">Archived performance data from previous months</p>
          </div>
          {archives.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No historical data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-sm text-gray-600">
                    <th className="px-6 py-4 font-semibold">Period</th>
                    <th className="px-6 py-4 font-semibold">Team Member</th>
                    <th className="px-6 py-4 font-semibold">Total Earnings</th>
                    <th className="px-6 py-4 font-semibold">Payments</th>
                    <th className="px-6 py-4 font-semibold">Clients</th>
                    <th className="px-6 py-4 font-semibold">Target Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {archives.map((archive) => (
                    <tr key={archive.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {getMonthName(archive.month)} {archive.year}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{archive.user?.full_name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(archive.total_earnings)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{archive.total_payments}</td>
                      <td className="px-6 py-4 text-gray-700">{archive.total_clients}</td>
                      <td className="px-6 py-4">
                        {archive.target_achieved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Achieved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-sm font-medium">
                            <XCircle className="w-4 h-4" />
                            Not Achieved
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
