import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { wahaClient, mapWAHAStatus } from '../lib/waha';
import { Modal } from '../components/Modal';
import {
  Smartphone,
  Plus,
  QrCode,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface Device {
  id: string;
  name: string;
  phone_number: string | null;
  session_id: string;
  status: 'connected' | 'disconnected' | 'scanning';
  qr_code: string | null;
  last_connected_at: string | null;
  webhook_url: string | null;
  created_at: string;
}

export function DevicesPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceWebhook, setNewDeviceWebhook] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [wahaAvailable, setWahaAvailable] = useState(false);
  const [connectingDevice, setConnectingDevice] = useState<string | null>(null);
  const [qrPollingInterval, setQrPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Edit device state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editDeviceName, setEditDeviceName] = useState('');
  const [editDeviceWebhook, setEditDeviceWebhook] = useState('');
  
  // Webhook test state
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDevices();
      checkWAHAAvailability();
    }
  }, [user]);

  useEffect(() => {
    // Cleanup polling interval on unmount
    return () => {
      if (qrPollingInterval) {
        clearInterval(qrPollingInterval);
      }
    };
  }, [qrPollingInterval]);

  async function checkWAHAAvailability() {
    try {
      const available = await wahaClient.healthCheck();
      setWahaAvailable(available);
    } catch (error) {
      console.error('WAHA health check failed:', error);
      setWahaAvailable(false);
    }
  }

  async function loadDevices() {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDevice() {
    if (!newDeviceName.trim()) {
      alert('Device name is required');
      return;
    }

    setSubmitting(true);
    try {
      // WAHA Plus support unlimited sessions dengan custom names
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const { data, error } = await supabase.from('devices').insert({
        user_id: user!.id,
        name: newDeviceName,
        session_id: sessionId,
        webhook_url: newDeviceWebhook || null,
        status: 'disconnected',
      }).select().single();

      if (error) throw error;

      setNewDeviceName('');
      setNewDeviceWebhook('');
      setShowAddDialog(false);
      await loadDevices();

      // Auto-connect device setelah dibuat
      if (data) {
        await handleConnectDevice(data);
      }
    } catch (error) {
      console.error('Error adding device:', error);
      alert(t.errors.generic);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConnectDevice(device: Device) {
    if (!wahaAvailable) {
      alert('WAHA server is not available. Please make sure WAHA is running on ' + import.meta.env.VITE_WAHA_URL);
      return;
    }

    setConnectingDevice(device.id);
    try {
      // Start WAHA session (webhook configured to API VRO backend)
      await wahaClient.startSession(device.session_id);

      // Update device status to scanning
      const { error } = await supabase
        .from('devices')
        .update({ status: 'scanning' })
        .eq('id', device.id);

      if (error) throw error;

      // Start polling for QR code
      startQRPolling(device);

      await loadDevices();
    } catch (error) {
      console.error('Error connecting device:', error);
      alert('Failed to start WhatsApp session: ' + (error as Error).message);
    } finally {
      setConnectingDevice(null);
    }
  }

  async function pollQRCode(device: Device, startTime?: number) {
    try {
      // Get session status
      const session = await wahaClient.getSessionStatus(device.session_id);
      const newStatus = mapWAHAStatus(session.status);

      // QR timeout after 60 seconds (like WhatsApp Web)
      const now = Date.now();
      const elapsed = startTime ? (now - startTime) / 1000 : 0;
      
      if (elapsed > 60 && newStatus === 'scanning') {
        // QR expired, stop polling first
        if (qrPollingInterval) {
          clearInterval(qrPollingInterval);
          setQrPollingInterval(null);
        }
        
        // Delete session completely to stop QR generation
        try {
          await wahaClient.logout(device.session_id);
        } catch (e) {
          console.log('Logout error (expected):', e);
        }
        
        try {
          await wahaClient.stopSession(device.session_id);
        } catch (e) {
          console.log('Stop session error (expected):', e);
        }
        
        try {
          // DELETE session to completely remove it from WAHA
          await wahaClient.deleteSession(device.session_id);
          console.log('Session deleted successfully');
        } catch (e) {
          console.log('Delete session error (expected):', e);
        }
        
        // Update database
        await supabase
          .from('devices')
          .update({ 
            status: 'disconnected',
            qr_code: null,
          })
          .eq('id', device.id);
        
        await loadDevices();
        
        alert('QR code expired. Please try connecting again.');
        return;
      }

      // Try to get QR code if scanning
      let qrCode = null;
      if (session.status === 'SCAN_QR_CODE') {
        try {
          const qr = await wahaClient.getQRCode(device.session_id);
          qrCode = qr.value;
        } catch (error) {
          console.error('Error getting QR code:', error);
        }
      }

      // Update device in database
      const updateData: any = { status: newStatus };
      if (qrCode) {
        updateData.qr_code = qrCode;
      }
      if (newStatus === 'connected') {
        updateData.last_connected_at = new Date().toISOString();
        // Clear QR code when connected
        updateData.qr_code = null;
        // Get phone number from session
        if (session.me) {
          // WAHA returns object like {"id":"628xxx","pushName":"Name"}
          // Extract just the ID
          try {
            const meData = typeof session.me === 'string' ? JSON.parse(session.me) : session.me;
            updateData.phone_number = meData.id || session.me;
          } catch {
            updateData.phone_number = session.me;
          }
        }
      }

      await supabase
        .from('devices')
        .update(updateData)
        .eq('id', device.id);

      await loadDevices();

      // Stop polling if connected or failed
      if (newStatus === 'connected' || session.status === 'FAILED') {
        if (qrPollingInterval) {
          clearInterval(qrPollingInterval);
          setQrPollingInterval(null);
        }
      }
    } catch (error) {
      console.error('Error polling QR code:', error);
    }
  }

  function startQRPolling(device: Device) {
    // Clear any existing interval
    if (qrPollingInterval) {
      clearInterval(qrPollingInterval);
    }

    // Track start time for QR timeout
    const startTime = Date.now();

    // Poll immediately first time
    pollQRCode(device, startTime);

    // Then poll every 1.5 seconds for faster updates
    const interval = setInterval(() => pollQRCode(device, startTime), 1500);

    setQrPollingInterval(interval);
  }

  async function handleDisconnectDevice(device: Device) {
    if (!confirm('Are you sure you want to disconnect this device?')) return;

    try {
      await wahaClient.logout(device.session_id);
      await wahaClient.stopSession(device.session_id);

      const { error } = await supabase
        .from('devices')
        .update({ 
          status: 'disconnected',
          qr_code: null,
        })
        .eq('id', device.id);

      if (error) throw error;

      // Send disconnect notification email
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/devices/${device.id}/disconnect-notification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          });
          console.log('📧 Disconnect notification sent');
        }
      } catch (emailError) {
        console.error('Failed to send disconnect notification:', emailError);
        // Don't fail the disconnect operation if email fails
      }

      await loadDevices();
    } catch (error) {
      console.error('Error disconnecting device:', error);
      alert('Failed to disconnect device: ' + (error as Error).message);
    }
  }

  function handleOpenEditDialog(device: Device) {
    setEditingDevice(device);
    setEditDeviceName(device.name);
    setEditDeviceWebhook(device.webhook_url || '');
    setShowEditDialog(true);
  }

  async function handleSaveEditDevice() {
    if (!editingDevice) return;
    if (!editDeviceName.trim()) {
      alert('Device name is required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('devices')
        .update({
          name: editDeviceName.trim(),
          webhook_url: editDeviceWebhook.trim() || null,
        })
        .eq('id', editingDevice.id);

      if (error) throw error;

      setShowEditDialog(false);
      setEditingDevice(null);
      setEditDeviceName('');
      setEditDeviceWebhook('');
      await loadDevices();
      alert('✅ Device updated successfully!');
    } catch (error) {
      console.error('Error updating device:', error);
      alert('Failed to update device: ' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDevice(id: string) {
    if (!confirm(t.devices.deleteConfirm)) return;

    try {
      const device = devices.find(d => d.id === id);
      if (device && device.status !== 'disconnected') {
        // Stop WAHA session first
        try {
          await wahaClient.stopSession(device.session_id);
        } catch (error) {
          console.error('Error stopping WAHA session:', error);
        }
      }

      const { error } = await supabase.from('devices').delete().eq('id', id);

      if (error) throw error;

      await loadDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
      alert(t.errors.generic);
    }
  }

  async function handleTestWebhook(device: Device) {
    if (!device.webhook_url) {
      alert('No webhook URL configured');
      return;
    }

    setTestingWebhook(device.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Not authenticated');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/webhooks/test/${device.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(`✅ Webhook test successful!\nStatus: ${result.status_code}\nResponse time: ${result.response_time_ms}ms`);
      } else {
        alert(`❌ Webhook test failed!\n${result.message}\nStatus: ${result.status_code || 'N/A'}\nResponse time: ${result.response_time_ms || 'N/A'}ms`);
      }
    } catch (error: any) {
      console.error('Error testing webhook:', error);
      alert('Failed to test webhook: ' + error.message);
    } finally {
      setTestingWebhook(null);
    }
  }

  function getStatusIcon(status: Device['status']) {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'scanning':
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  }

  function getStatusText(status: Device['status']) {
    switch (status) {
      case 'connected':
        return t.devices.connected;
      case 'disconnected':
        return t.devices.disconnected;
      case 'scanning':
        return t.devices.scanning;
    }
  }

  function getStatusColor(status: Device['status']) {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'scanning':
        return 'bg-yellow-100 text-yellow-800';
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
          <h1 className="text-2xl font-bold text-slate-900">{t.devices.title}</h1>
          <p className="text-slate-600 mt-1">
            Manage your WhatsApp devices and sessions
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          {t.devices.addDevice}
        </button>
      </div>

      {/* WAHA Status Alert */}
      {!wahaAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 mb-1">WAHA Plus Server Not Available</h3>
            <p className="text-sm text-yellow-800">
              WhatsApp HTTP API (WAHA Plus) server is not running. Please start WAHA Plus server at{' '}
              <code className="bg-yellow-100 px-2 py-0.5 rounded">{import.meta.env.VITE_WAHA_URL}</code>
            </p>
            <p className="text-sm text-yellow-800 mt-2">
              Run: <code className="bg-yellow-100 px-2 py-0.5 rounded">docker run -d -p 3000:3000 devlikeapro/waha-plus:latest</code>
            </p>
          </div>
        </div>
      )}

      {devices.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <Smartphone className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{t.devices.noDevices}</h3>
          <p className="text-slate-600 mb-6">{t.devices.addFirstDevice}</p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            {t.devices.addDevice}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <div key={device.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg">{device.name}</h3>
                    {device.phone_number && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        +{device.phone_number.replace('@c.us', '').replace(/[^0-9]/g, '')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditDialog(device)}
                    className="text-slate-300 hover:text-blue-500 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                    title="Edit device"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDevice(device.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                    title="Delete device"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor(
                    device.status
                  )}`}
                >
                  {getStatusIcon(device.status)}
                  <span className="text-sm font-medium">{getStatusText(device.status)}</span>
                </div>

                {device.status === 'disconnected' && (
                  <button 
                    onClick={() => handleConnectDevice(device)}
                    disabled={!wahaAvailable || connectingDevice === device.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <QrCode className="w-4 h-4" />
                    {connectingDevice === device.id ? 'Connecting...' : 'Connect Device'}
                  </button>
                )}

                {device.status === 'scanning' && (
                  <div className="space-y-3">
                    {device.qr_code ? (
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="bg-white p-3 rounded-lg inline-block mx-auto">
                          <img
                            src={device.qr_code}
                            alt="QR Code"
                            className="w-48 h-48 mx-auto"
                            onError={(e) => {
                              console.error('QR code image failed to load');
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <p className="text-xs text-center text-slate-600 mt-3">
                          📱 Scan this QR code with WhatsApp
                        </p>
                        <p className="text-xs text-center text-slate-500 mt-1">
                          Open WhatsApp → Settings → Linked Devices → Link a Device
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <RefreshCw className="w-6 h-6 text-slate-400 mx-auto mb-2 animate-spin" />
                        <p className="text-xs text-slate-600">Generating QR code...</p>
                      </div>
                    )}
                  </div>
                )}

                {device.status === 'connected' && (
                  <button 
                    onClick={() => handleDisconnectDevice(device)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium border border-slate-200"
                  >
                    <XCircle className="w-4 h-4" />
                    Disconnect
                  </button>
                )}

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {device.last_connected_at && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Last Connected:</span>
                      <span className="text-slate-700">{new Date(device.last_connected_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {device.webhook_url && (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Webhook:</span>
                        <span className="text-slate-700 truncate ml-2 max-w-[180px]" title={device.webhook_url}>
                          {device.webhook_url}
                        </span>
                      </div>
                      
                      {/* Webhook Actions */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleTestWebhook(device)}
                          disabled={testingWebhook === device.id}
                          className="flex-1 px-3 py-1.5 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          {testingWebhook === device.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Test
                            </>
                          )}
                        </button>
                        
                        <a
                          href={`/webhook-logs?device=${device.id}`}
                          className="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium flex items-center justify-center gap-1"
                        >
                          View Logs →
                        </a>
                      </div>
                    </>
                  )}
                  {/* Session ID hidden - not needed for users */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title={t.devices.addDevice}
        maxWidth="md"
      >
        <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.devices.deviceName}
                </label>
                <input
                  type="text"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="My WhatsApp Device"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.devices.webhookUrl}
                  <span className="text-slate-500 font-normal ml-1">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={newDeviceWebhook}
                  onChange={(e) => setNewDeviceWebhook(e.target.value)}
                  placeholder="https://your-webhook-url.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">{t.devices.webhookDescription}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddDialog(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleAddDevice}
                  disabled={!newDeviceName.trim() || submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t.common.loading : t.common.create}
                </button>
              </div>
        </div>
      </Modal>

      {/* Edit Device Dialog */}
      <Modal
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingDevice(null);
        }}
        title="Edit Device"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Device Name
            </label>
            <input
              type="text"
              value={editDeviceName}
              onChange={(e) => setEditDeviceName(e.target.value)}
              placeholder="My WhatsApp Device"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Webhook URL
              <span className="text-slate-500 font-normal ml-1">(Optional)</span>
            </label>
            <input
              type="url"
              value={editDeviceWebhook}
              onChange={(e) => setEditDeviceWebhook(e.target.value)}
              placeholder="https://your-webhook-url.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Receive incoming messages via webhook
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowEditDialog(false);
                setEditingDevice(null);
              }}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEditDevice}
              disabled={!editDeviceName.trim() || submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
