import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp, MessageSquare, CheckCircle } from 'lucide-react';

interface Stats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  successRate: number;
}

export function StatisticsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  async function loadStats() {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [todayData, weekData, monthData, allTimeData, successData] = await Promise.all([
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .gte('created_at', todayStart.toISOString()),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .gte('created_at', weekStart.toISOString()),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .gte('created_at', monthStart.toISOString()),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id),
        supabase
          .from('messages')
          .select('status', { count: 'exact', head: false })
          .eq('user_id', user!.id),
      ]);

      const total = allTimeData.count || 0;
      const successful = successData.data?.filter((m) => m.status === 'sent').length || 0;
      const successRate = total > 0 ? (successful / total) * 100 : 0;

      setStats({
        today: todayData.count || 0,
        thisWeek: weekData.count || 0,
        thisMonth: monthData.count || 0,
        allTime: total,
        successRate,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">{t.common.loading}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">{t.errors.generic}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.statistics.title}</h1>
        <p className="text-slate-600 mt-1">View your messaging statistics and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">{t.statistics.today}</p>
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.today.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">{t.statistics.messagesSent}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">{t.statistics.thisWeek}</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.thisWeek.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">{t.statistics.messagesSent}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">{t.statistics.thisMonth}</p>
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.thisMonth.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">{t.statistics.messagesSent}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">{t.statistics.successRate}</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.successRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-500 mt-1">Delivery rate</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t.statistics.allTime}</h3>
        <div className="flex items-baseline gap-4">
          <p className="text-4xl font-bold text-slate-900">{stats.allTime.toLocaleString()}</p>
          <p className="text-slate-600">{t.statistics.messagesSent}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Coming Soon</h3>
        <p className="text-blue-700 text-sm">
          Advanced analytics, charts, and detailed breakdowns will be available in the next update.
        </p>
      </div>
    </div>
  );
}
