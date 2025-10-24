import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/Modal';
import { Key, Plus, Copy, Check, Trash2, Eye, EyeOff } from 'lucide-react';

interface APIKey {
  id: string;
  device_id: string;
  key_prefix: string;
  name: string;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
  devices: {
    name: string;
  };
}

interface Device {
  id: string;
  name: string;
}

export function APIKeysPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      const [keysData, devicesData] = await Promise.all([
        supabase
          .from('api_keys')
          .select('*, devices(name)')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase.from('devices').select('id, name').eq('user_id', user!.id),
      ]);

      if (keysData.error) throw keysData.error;
      if (devicesData.error) throw devicesData.error;

      setApiKeys(keysData.data || []);
      setDevices(devicesData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateKey() {
    if (!newKeyName.trim() || !selectedDeviceId) return;

    setSubmitting(true);
    try {
      const fullKey = `apivro${generateRandomKey(32)}`;
      const keyHash = await hashKey(fullKey);
      const keyPrefix = fullKey.substring(0, 20); // apivroXXXXXXXX

      const { error } = await supabase.from('api_keys').insert({
        user_id: user!.id,
        device_id: selectedDeviceId,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: newKeyName,
      });

      if (error) throw error;

      setNewlyCreatedKey(fullKey);
      setNewKeyName('');
      setSelectedDeviceId('');
      await loadData();
    } catch (error) {
      console.error('Error creating key:', error);
      alert(t.errors.generic);
    } finally {
      setSubmitting(false);
    }
  }

  function generateRandomKey(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async function hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function handleRevokeKey(id: string) {
    if (!confirm(t.apiKeys.revokeConfirm)) return;

    try {
      const { error } = await supabase.from('api_keys').update({ is_active: false }).eq('id', id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Error revoking key:', error);
      alert(t.errors.generic);
    }
  }

  async function handleDeleteKey(id: string) {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Error deleting key:', error);
      alert(t.errors.generic);
    }
  }

  async function handleCopyKey() {
    if (newlyCreatedKey) {
      await navigator.clipboard.writeText(newlyCreatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.apiKeys.title}</h1>
          <p className="text-slate-600 mt-1">
            Manage API keys for accessing the WhatsApp API
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          disabled={devices.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />
          {t.apiKeys.createKey}
        </button>
      </div>

      {devices.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            You need to add a device first before creating API keys.{' '}
            <a href="/devices" className="font-medium underline">
              Add a device
            </a>
          </p>
        </div>
      )}

      {apiKeys.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <Key className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{t.apiKeys.noKeys}</h3>
          <p className="text-slate-600 mb-6">{t.apiKeys.createFirstKey}</p>
          {devices.length > 0 && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              {t.apiKeys.createKey}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.apiKeys.keyName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.apiKeys.device}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.apiKeys.prefix}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.apiKeys.lastUsed}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.apiKeys.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Key className="w-4 h-4 text-slate-400 mr-2" />
                        <span className="text-sm font-medium text-slate-900">{key.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-700">{key.devices.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {key.key_prefix}...
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-500">
                        {key.last_used_at
                          ? new Date(key.last_used_at).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          key.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {key.is_active ? t.apiKeys.active : t.apiKeys.inactive}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {key.is_active && (
                          <button
                            onClick={() => handleRevokeKey(key.id)}
                            className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                          >
                            {t.apiKeys.revoke}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete API key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setNewlyCreatedKey(null);
        }}
        title={t.apiKeys.createKey}
        maxWidth="md"
      >
        {newlyCreatedKey ? (
          <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-900 mb-2">{t.apiKeys.copyKey}</p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={newlyCreatedKey}
                    readOnly
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg font-mono text-sm bg-slate-50"
                  />
                  <button
                    onClick={handleCopyKey}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedKey ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowCreateDialog(false);
                    setNewlyCreatedKey(null);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {t.common.close}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.apiKeys.keyName}
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="My API Key"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.apiKeys.device}
                  </label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t.apiKeys.selectDevice}</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateDialog(false);
                      setNewKeyName('');
                      setSelectedDeviceId('');
                    }}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={handleCreateKey}
                    disabled={!newKeyName.trim() || !selectedDeviceId || submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? t.common.loading : t.common.create}
                  </button>
                </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
