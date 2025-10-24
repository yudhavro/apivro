import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { User, Globe, Bell } from 'lucide-react';

interface NotificationPreferences {
  payment_success: boolean;
  subscription_reminder: boolean;
  device_disconnect: boolean;
  limit_reached: boolean;
}

export function SettingsPage() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(language);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    payment_success: true,
    subscription_reminder: true,
    device_disconnect: true,
    limit_reached: true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      loadNotificationPreferences();
    }
  }, [user]);

  async function loadNotificationPreferences() {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading notification preferences:', error);
        return;
      }

      if (data) {
        const prefs = data as any;
        setNotifPrefs({
          payment_success: prefs.payment_success ?? true,
          subscription_reminder: prefs.subscription_reminder ?? true,
          device_disconnect: prefs.device_disconnect ?? true,
          limit_reached: prefs.limit_reached ?? true,
        });
      } else {
        // No preferences yet, will be created on first save
        console.log('No notification preferences found, using defaults');
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user!.id);

      if (error) throw error;

      alert(t.settings.changesSaved);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(t.errors.generic);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotifications() {
    setSavingNotifs(true);
    try {
      const payload = {
        user_id: user!.id,
        payment_success: notifPrefs.payment_success,
        subscription_reminder: notifPrefs.subscription_reminder,
        device_disconnect: notifPrefs.device_disconnect,
        limit_reached: notifPrefs.limit_reached,
      };

      const { error } = await supabase
        .from('notification_preferences')
        .upsert(payload as any, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      alert('✅ Notification preferences saved successfully!');
    } catch (error: any) {
      console.error('Error saving notification preferences:', error);
      alert(`❌ Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingNotifs(false);
    }
  }

  function toggleNotifPref(key: keyof NotificationPreferences) {
    setNotifPrefs(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.settings.title}</h1>
        <p className="text-slate-600 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t.settings.profile}</h2>
            <p className="text-sm text-slate-600">Update your personal information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.settings.email}
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.settings.fullName}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t.common.loading : t.settings.saveChanges}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-xl">
            <Globe className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t.settings.language}</h2>
            <p className="text-sm text-slate-600">Choose your preferred language</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="radio"
              name="language"
              value="en"
              checked={language === 'en'}
              onChange={() => setLanguage('en')}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex-1">
              <p className="font-medium text-slate-900">English</p>
              <p className="text-sm text-slate-600">English language</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="radio"
              name="language"
              value="id"
              checked={language === 'id'}
              onChange={() => setLanguage('id')}
              className="w-4 h-4 text-blue-600"
            />
            <div className="flex-1">
              <p className="font-medium text-slate-900">Bahasa Indonesia</p>
              <p className="text-sm text-slate-600">Indonesian language</p>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-xl">
            <Bell className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t.settings.notifications}</h2>
            <p className="text-sm text-slate-600">Manage your notification preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <div>
              <p className="font-medium text-slate-900">{t.settings.paymentUpdates}</p>
              <p className="text-sm text-slate-600">Get updates about your payments</p>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.payment_success}
              onChange={() => toggleNotifPref('payment_success')}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <div>
              <p className="font-medium text-slate-900">{t.settings.expiryReminders}</p>
              <p className="text-sm text-slate-600">Receive reminders before subscription expires</p>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.subscription_reminder}
              onChange={() => toggleNotifPref('subscription_reminder')}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <div>
              <p className="font-medium text-slate-900">{t.settings.deviceAlerts}</p>
              <p className="text-sm text-slate-600">Get notified when devices disconnect</p>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.device_disconnect}
              onChange={() => toggleNotifPref('device_disconnect')}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <div>
              <p className="font-medium text-slate-900">Limit Reached Alerts</p>
              <p className="text-sm text-slate-600">Get notified when you reach your message limit</p>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.limit_reached}
              onChange={() => toggleNotifPref('limit_reached')}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          <button
            onClick={handleSaveNotifications}
            disabled={savingNotifs}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingNotifs ? 'Saving...' : 'Save Notification Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
