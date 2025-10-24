import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { MessageSquare, Smartphone, Key, TrendingUp, BarChart3 } from 'lucide-react';

interface DashboardStats {
  messagesUsed: number;
  messageLimit: number;
  totalMessages: number;
  activeDevices: number;
  activeApiKeys: number;
  planName: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  async function loadStats() {
    try {
      const [subscriptionData, profileData, devicesData, apiKeysData] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('messages_used, subscription_plans(name, message_limit)')
          .eq('user_id', user!.id)
          .eq('status', 'active')
          .maybeSingle(),
        supabase.from('profiles').select('total_messages_sent').eq('id', user!.id).maybeSingle(),
        supabase.from('devices').select('id').eq('user_id', user!.id).eq('status', 'connected'),
        supabase.from('api_keys').select('id').eq('user_id', user!.id).eq('is_active', true),
      ]);

      const subscription = subscriptionData.data;
      const profile = profileData.data;

      setStats({
        messagesUsed: subscription?.messages_used || 0,
        messageLimit: (subscription?.subscription_plans as any)?.message_limit || 0,
        totalMessages: profile?.total_messages_sent || 0,
        activeDevices: devicesData.data?.length || 0,
        activeApiKeys: apiKeysData.data?.length || 0,
        planName: (subscription?.subscription_plans as any)?.name || 'Free',
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

  const usagePercentage = (stats.messagesUsed / stats.messageLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Header with Statistics Button */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.dashboard.title}</h1>
          <p className="text-slate-600 mt-1">
            {t.dashboard.overview}
          </p>
        </div>
        <a
          href="/statistics"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          {t.navigation.statistics}
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                {t.dashboard.totalMessagesSent}
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {stats.totalMessages.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 mt-1">{t.statistics.allTime}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                {t.dashboard.devicesConnected}
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.activeDevices}</p>
              <p className="text-sm text-slate-500 mt-1">{t.devices.connected}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
              <Smartphone className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{t.dashboard.apiKeysActive}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.activeApiKeys}</p>
              <p className="text-sm text-slate-500 mt-1">{t.apiKeys.active}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl">
              <Key className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {t.dashboard.messagesThisMonth}
          </h3>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-slate-900">
              {stats.messagesUsed.toLocaleString()}
            </p>
            <p className="text-sm text-slate-500 pb-1">
              {t.dashboard.messageLimit} {stats.messageLimit.toLocaleString()}
            </p>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  usagePercentage > 90
                    ? 'bg-red-500'
                    : usagePercentage > 70
                    ? 'bg-yellow-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">{usagePercentage.toFixed(1)}% used</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {t.subscription.currentPlan}
        </h3>
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
          <div>
            <p className="text-2xl font-bold text-blue-900">{stats.planName}</p>
            <p className="text-sm text-blue-700 mt-1">
              {stats.messageLimit.toLocaleString()} {t.subscription.messagesPerMonth}
            </p>
          </div>
          {stats.planName === 'Free' && (
            <a
              href="/subscription"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {t.subscription.upgrade}
            </a>
          )}
        </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/devices"
            className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium text-slate-700">
              {t.devices.addDevice}
            </span>
            <Smartphone className="w-5 h-5 text-slate-400" />
          </a>
          <a
            href="/api-keys"
            className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium text-slate-700">{t.apiKeys.createKey}</span>
            <Key className="w-5 h-5 text-slate-400" />
          </a>
          <a
            href="/documentation"
            className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium text-slate-700">
              {t.navigation.documentation}
            </span>
            <MessageSquare className="w-5 h-5 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
