import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Database,
  Palette,
  CheckCircle,
  RotateCcw,
  Settings,
  Shield,
  User,

} from 'lucide-react';
import api from '../services/api';
import { PageHeader } from '../components/layout/PageHeader';


interface SettingsPageProps {
  pollIntervals?: {
    alerts: number;
    clients: number;
    iocs: number;
  };
  onUpdatePollInterval?: (type: 'alerts' | 'clients' | 'iocs', intervalMs: number) => void;
  onSaveSettings?: (settings: Record<string, unknown>) => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ pollIntervals, onUpdatePollInterval, onSaveSettings }) => {
  const [settings, setSettings] = useState({
    alertsPollInterval: 10000,
    clientsPollInterval: 30000,
    iocsPollInterval: 60000,
    alertThreshold: 5,
    retentionDays: 30,
    darkMode: false,
    autoRefresh: true,
    apiRateLimit: 1000,
    emailNotifications: true,
    enableAuditLog: true,
    dataEncryption: true,
    twoFactorAuth: false,
    logLevel: 'info',
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);


  // Load poll intervals from props
  useEffect(() => {
    if (pollIntervals) {
      setSettings(prev => ({
        ...prev,
        alertsPollInterval: pollIntervals.alerts,
        clientsPollInterval: pollIntervals.clients,
        iocsPollInterval: pollIntervals.iocs,
      }));
    }
  }, [pollIntervals]);

  const handleSave = async () => {
    setSaving(true);
    
    // Save to localStorage
    localStorage.setItem('threatshield_settings', JSON.stringify(settings));
   
    // Update polling intervals via callback
    if (onUpdatePollInterval) {
      onUpdatePollInterval('alerts', settings.alertsPollInterval);
      onUpdatePollInterval('clients', settings.clientsPollInterval);
      onUpdatePollInterval('iocs', settings.iocsPollInterval);
    }
    
    // Persist full settings to server via callback if provided
    try {
      if (onSaveSettings) {
        const payload: Record<string, unknown> = {
          pollInterval_alerts: settings.alertsPollInterval,
          pollInterval_clients: settings.clientsPollInterval,
          pollInterval_iocs: settings.iocsPollInterval,
          alertThreshold: settings.alertThreshold,
          retentionDays: settings.retentionDays,
          darkMode: settings.darkMode,
          autoRefresh: settings.autoRefresh,
          apiRateLimit: settings.apiRateLimit,
          emailNotifications: settings.emailNotifications,
          enableAuditLog: settings.enableAuditLog,
          dataEncryption: settings.dataEncryption,
          twoFactorAuth: settings.twoFactorAuth,
          logLevel: settings.logLevel,
        };
        await onSaveSettings(payload);
      }
      
      // If retentionDays specified, attempt a server cleanup
      try {
        await api.post('/api/alerts/cleanup', { days: settings.retentionDays });
      } catch (err) {
        // ignore cleanup failures
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.debug('failed to persist settings', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaults = {
      alertsPollInterval: 10000,
      clientsPollInterval: 30000,
      iocsPollInterval: 60000,
      alertThreshold: 5,
      retentionDays: 30,
      emailNotifications: true,
      darkMode: false,
      autoRefresh: true,
      enableAuditLog: true,
      dataEncryption: true,
      twoFactorAuth: false,
      apiRateLimit: 1000,
      logLevel: 'info',
    };
    setSettings(defaults);
    if (onUpdatePollInterval) {
      onUpdatePollInterval('alerts', 10000);
      onUpdatePollInterval('clients', 30000);
      onUpdatePollInterval('iocs', 60000);
    }
    if (onSaveSettings) {
      const payload: Record<string, unknown> = {
        pollInterval_alerts: defaults.alertsPollInterval,
        pollInterval_clients: defaults.clientsPollInterval,
        pollInterval_iocs: defaults.iocsPollInterval,
        alertThreshold: defaults.alertThreshold,
        retentionDays: defaults.retentionDays,
        emailNotifications: defaults.emailNotifications,
        darkMode: defaults.darkMode,
        autoRefresh: defaults.autoRefresh,
        enableAuditLog: defaults.enableAuditLog,
        dataEncryption: defaults.dataEncryption,
        twoFactorAuth: defaults.twoFactorAuth,
        apiRateLimit: defaults.apiRateLimit,
        logLevel: defaults.logLevel,
      };
      onSaveSettings(payload).catch(err => console.debug('failed to reset settings', err));
    }
  };

  const SettingSection = ({ 
    title, 
    icon: Icon, 
    children,
    gradient = "from-blue-500 to-blue-600"
  }: { 
    title: string; 
    icon: any; 
    children: React.ReactNode;
    gradient?: string;
  }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">Configure {title.toLowerCase()} preferences</p>
        </div>
      </div>
      {children}
    </div>
  );

  const SettingRow = ({ 
    label, 
    description, 
    children 
  }: { 
    label: string; 
    description?: string; 
    children: React.ReactNode;
  }) => (
    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <label className="block text-sm font-semibold text-gray-900">{label}</label>
      {children}
      {description && (
        <p className="text-xs text-gray-600 mt-2">{description}</p>
      )}
    </div>
  );

  const ToggleSetting = ({ 
    label, 
    description, 
    checked, 
    onChange,
    icon: Icon
  }: { 
    label: string; 
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    icon: any;
  }) => (
    <label className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group">
      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
      <div className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-green-500' : 'bg-gray-300'
      }`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`} />
      </div>
    </label>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <PageHeader
          title="System Settings"
          description="Configure application preferences, monitoring intervals, and security policies"
          icon={<Settings className="w-6 h-6 text-blue-300" />}
          gradient="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900"
          action={
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Settings Protected</span>
            </div>
          }
        />

        

        <div className="space-y-6">
          {/* Monitoring Intervals */}
          <SettingSection 
            title="Monitoring Intervals" 
            icon={RefreshCw}
            gradient="from-blue-500 to-blue-600"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingRow 
                label="Alerts Polling Interval"
                description="How often to check for new alerts (default: 10 seconds)"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5000"
                    max="60000"
                    step="5000"
                    value={settings.alertsPollInterval}
                    onChange={e =>
                      setSettings({ ...settings, alertsPollInterval: Number(e.target.value) })
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm font-mono font-semibold text-blue-600 min-w-16">
                    {settings.alertsPollInterval / 1000}s
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>5s</span>
                  <span>30s</span>
                  <span>60s</span>
                </div>
              </SettingRow>

              <SettingRow 
                label="Clients Polling Interval"
                description="How often to check for client updates (default: 30 seconds)"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10000"
                    max="120000"
                    step="10000"
                    value={settings.clientsPollInterval}
                    onChange={e =>
                      setSettings({ ...settings, clientsPollInterval: Number(e.target.value) })
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm font-mono font-semibold text-blue-600 min-w-16">
                    {settings.clientsPollInterval / 1000}s
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>10s</span>
                  <span>60s</span>
                  <span>120s</span>
                </div>
              </SettingRow>

              <SettingRow 
                label="IOCs Polling Interval"
                description="How often to check for IOC updates (default: 60 seconds)"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="30000"
                    max="300000"
                    step="30000"
                    value={settings.iocsPollInterval}
                    onChange={e =>
                      setSettings({ ...settings, iocsPollInterval: Number(e.target.value) })
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm font-mono font-semibold text-blue-600 min-w-16">
                    {settings.iocsPollInterval / 1000}s
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>30s</span>
                  <span>150s</span>
                  <span>300s</span>
                </div>
              </SettingRow>

              <SettingRow 
                label="Alert Threshold"
                description="Minimum severity level to create an alert (1-20)"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={settings.alertThreshold}
                    onChange={e =>
                      setSettings({ ...settings, alertThreshold: Number(e.target.value) })
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm font-mono font-semibold text-blue-600 min-w-8">
                    {settings.alertThreshold}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </SettingRow>
            </div>
          </SettingSection>

          {/* Data Management */}
          <SettingSection 
            title="Data Management" 
            icon={Database}
            gradient="from-green-500 to-green-600"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingRow 
                label="Data Retention Period"
                description="How long to retain historical alert data (7-365 days)"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="7"
                    max="365"
                    value={settings.retentionDays}
                    onChange={e =>
                      setSettings({ ...settings, retentionDays: Number(e.target.value) })
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm font-mono font-semibold text-green-600 min-w-12">
                    {settings.retentionDays}d
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>7d</span>
                  <span>180d</span>
                  <span>365d</span>
                </div>
              </SettingRow>

              <SettingRow 
                label="API Rate Limit"
                description="Maximum API requests per minute (100-10000)"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={settings.apiRateLimit}
                    onChange={e =>
                      setSettings({ ...settings, apiRateLimit: Number(e.target.value) })
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm font-mono font-semibold text-green-600 min-w-16">
                    {settings.apiRateLimit}/min
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>100</span>
                  <span>5000</span>
                  <span>10000</span>
                </div>
              </SettingRow>
            </div>
          </SettingSection>

          
          {/* User Preferences */}
          <SettingSection 
            title="User Preferences" 
            icon={User}
            gradient="from-purple-500 to-purple-600"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleSetting
                label="Auto Refresh"
                description="Automatically refresh dashboard data in real-time"
                checked={settings.autoRefresh}
                onChange={(checked) => setSettings({ ...settings, autoRefresh: checked })}
                icon={RefreshCw}
              />
              <ToggleSetting
                label="Dark Mode"
                description="Enable dark theme for better visibility in low light"
                checked={settings.darkMode}
                onChange={(checked) => setSettings({ ...settings, darkMode: checked })}
                icon={Palette}
              />
              
              
            </div>
          </SettingSection>

          {/* Success Message */}
          {saved && (
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 flex items-center gap-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-lg font-bold">Settings Saved Successfully</h3>
                <p className="text-green-100 text-sm">All configuration changes have been applied</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving Changes...' : 'Save All Settings'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-bold shadow-sm hover:shadow-md"
            >
              <RotateCcw className="w-5 h-5" />
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};