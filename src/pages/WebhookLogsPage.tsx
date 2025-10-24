import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface WebhookLog {
  id: string;
  device_id: string;
  webhook_url: string;
  event_type: string;
  status_code: number;
  response_time_ms: number;
  success: boolean;
  error_message: string | null;
  created_at: string;
  devices: {
    id: string;
    name: string;
  };
}

interface Stats {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  success_rate: number;
  avg_response_time_ms: number;
}

interface Device {
  id: string;
  name: string;
}

export function WebhookLogsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadDevices();
      loadLogs();
    }
  }, [user, page, selectedDevice, selectedEventType]);

  useEffect(() => {
    // Get device from URL params
    const params = new URLSearchParams(window.location.search);
    const deviceParam = params.get('device');
    if (deviceParam) {
      setSelectedDevice(deviceParam);
    }
  }, []);

  async function loadDevices() {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id, name')
        .eq('user_id', user!.id)
        .order('name');

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  }

  async function loadLogs() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });

      if (selectedDevice) {
        params.append('device_id', selectedDevice);
      }

      if (selectedEventType) {
        params.append('event_type', selectedEventType);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/webhooks/logs?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setLogs(result.data || []);
        setStats(result.stats);
        setTotalPages(result.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleDeviceFilter(deviceId: string) {
    setSelectedDevice(deviceId);
    setPage(1); // Reset to first page
  }

  function handleEventTypeFilter(eventType: string) {
    setSelectedEventType(eventType);
    setPage(1); // Reset to first page
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    return date.toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Webhook Logs</h1>
        <p className="text-slate-600 mt-1">Monitor webhook activity across all devices</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold text-slate-900">{stats.total_calls}</div>
              <div className="text-xs text-slate-500 mt-1">Total Calls</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold text-green-600">{stats.successful_calls}</div>
              <div className="text-xs text-slate-500 mt-1">Successful</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold text-red-600">{stats.failed_calls}</div>
              <div className="text-xs text-slate-500 mt-1">Failed</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold text-blue-600">{stats.success_rate}%</div>
              <div className="text-xs text-slate-500 mt-1">Success Rate</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold text-purple-600">{stats.avg_response_time_ms}ms</div>
              <div className="text-xs text-slate-500 mt-1">Avg Response</div>
            </div>
          </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Device</label>
              <select
                value={selectedDevice}
                onChange={(e) => handleDeviceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="">All Devices</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Event Type</label>
              <select
                value={selectedEventType}
                onChange={(e) => handleEventTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="">All Events</option>
                <option value="message.in">Message In</option>
                <option value="message.out">Message Out</option>
                <option value="webhook.test">Webhook Test</option>
                <option value="status.update">Status Update</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => loadLogs()}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-3 animate-spin" />
              <p className="text-slate-600">Loading logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No webhook logs found</p>
              <p className="text-sm text-slate-500 mt-1">
                Logs will appear here when webhooks are triggered
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Device
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Response Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                          {formatTimestamp(log.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {log.devices.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">
                            {log.event_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {log.success ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-medium">{log.status_code}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <span className="font-medium">{log.status_code || 'N/A'}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {log.response_time_ms}ms
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {log.error_message ? (
                            <span className="text-xs text-red-600 truncate max-w-xs block" title={log.error_message}>
                              {log.error_message}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
      </div>
    </div>
  );
}
