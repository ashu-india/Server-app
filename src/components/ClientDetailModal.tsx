import React, { useState, useEffect } from 'react';
import { 
  Client, 
  ClientDetailData, 
  ClientSoftware, 
  ClientAntivirus, 
  ClientNetworkInfo, 
  ClientThreatHistory,
  PolicyViolation,
  ComplianceStatus,
  NetworkChange
} from '../types';
import { clientService } from '../services/clientService';
import { policyService } from '../services/policyService';
import { formatters } from '../utils/formatters';
import { STATUS_COLORS, SEVERITY_COLORS } from '../utils/constants';
import { 
  X, Cpu, HardDrive, Wifi, AlertTriangle, Package, Shield, Network, 
  Calendar, Clock, MemoryStick, Building, 
  Activity, Server, FileText, ShieldAlert, Globe,
  Signal, WifiOff, CableIcon, Router,
 Cpu as CpuIcon,
  RefreshCw, CheckCircle, XCircle, TrendingUp, 
} from 'lucide-react';

interface ClientDetailModalProps {
  client: Client;
  onClose: () => void;
}

type TabType = 'overview' | 'software' | 'antivirus' | 'network' | 'threats' | 'violations';

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ client, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [detailData, setDetailData] = useState<ClientDetailData | null>(null);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [networkChanges, setNetworkChanges] = useState<NetworkChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await clientService.getClientDetail(client.id);
        setDetailData(data);
        
        // Trigger compliance analysis when data is loaded
        if (data) {
          await analyzeCompliance(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load client details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [client.id]);

  const analyzeCompliance = async (data?: ClientDetailData) => {
    if (!data) return;
    
    setAnalyzing(true);
    try {
      const result = await policyService.analyzeClientCompliance(client, data);
      setViolations(result.violations);
      setCompliance(result.compliance);
      setNetworkChanges(result.changes);
    } catch (err) {
      console.error('Failed to analyze compliance:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClientDetail(client.id);
      setDetailData(data);
      if (data) {
        await analyzeCompliance(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh client details');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = STATUS_COLORS[client.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.inactive;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                  <Server className="w-7 h-7 text-white" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${statusColors.bg}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{client.hostname}</h1>
                <p className="text-blue-200 text-sm font-mono">{client.unique_id}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors.bg} ${statusColors.text} shadow-sm`}>
                    {client.status.toUpperCase()}
                  </span>
                  <span className="text-blue-200 text-sm flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Last seen: {formatters.formatDateTime(client.last_seen)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
            >
              <X className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span className="text-slate-700">CPU:</span>
                <span className="font-semibold text-slate-900">{client.cpu_cores || 'N/A'} Cores</span>
              </div>
              <div className="flex items-center gap-2">
                <MemoryStick className="w-4 h-4 text-green-600" />
                <span className="text-slate-700">RAM:</span>
                <span className="font-semibold text-slate-900">
                  {client.total_memory ? formatters.formatBytes(client.total_memory) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-600" />
                <span className="text-slate-700">OS:</span>
                <span className="font-semibold text-slate-900">{client.os_name} {client.os_version}</span>
              </div>
            </div>
            {detailData && (
              <div className="flex items-center gap-4 text-xs">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  {detailData.software.length} Apps
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  {detailData.antivirus.length} AV Products
                </span>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                  {detailData.threats.length} Threats
                </span>
                {compliance && (
                  <span className={`px-2 py-1 rounded-full font-medium ${
                    compliance.overall_score >= 80 ? 'bg-green-100 text-green-800' :
                    compliance.overall_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Compliance: {compliance.overall_score}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-slate-200 bg-white">
          {(
            [
              { id: 'overview', label: 'System Overview', icon: Activity },
              { id: 'software', label: 'Installed Software', icon: Package },
              { id: 'antivirus', label: 'Security Status', icon: Shield },
              { id: 'network', label: 'Network Config', icon: Globe },
              { id: 'threats', label: 'Threat Intelligence', icon: ShieldAlert },
              { id: 'violations', label: 'Policy Compliance', icon: AlertTriangle },
            ] as const
          ).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-t-lg transition-all duration-200 font-medium text-sm group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-slate-600 font-medium">Loading client details...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {detailData && !loading && (
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <OverviewTab 
                  client={client} 
                  data={detailData} 
                  compliance={compliance}
                  violations={violations}
                  onRefresh={handleRefresh}
                  analyzing={analyzing}
                />
              )}
              {activeTab === 'software' && <SoftwareTab software={detailData.software} />}
              {activeTab === 'antivirus' && <AntivirusTab antivirus={detailData.antivirus} />}
              {activeTab === 'network' && <NetworkTab network={detailData.network} />}
              {activeTab === 'threats' && <ThreatsTab threats={detailData.threats} />}
              {activeTab === 'violations' && (
                <PolicyViolationsTab 
                  client={client} 
                  data={detailData}
                  violations={violations}
                  compliance={compliance}
                  networkChanges={networkChanges}
                  onDataRefresh={handleRefresh}
                  analyzing={analyzing}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced OverviewTab Component
const OverviewTab: React.FC<{ 
  client: Client; 
  data: ClientDetailData;
  compliance: ComplianceStatus | null;
  violations: PolicyViolation[];
  onRefresh: () => void;
  analyzing: boolean;
}> = ({ client, data, compliance, violations, onRefresh, analyzing }) => {
  const securitySoftware = data.software.filter(s => s.is_security_related);
  const runningAntivirus = data.antivirus.filter(av => av.is_running);
  const activeThreats = data.threats.filter(t => !t.resolved_at);
  const highSeverityThreats = data.threats.filter(t => t.severity === 'high' || t.severity === 'critical');
  const criticalViolations = violations.filter(v => v.severity === 'critical');

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">System Overview</h2>
          <p className="text-sm text-slate-600">Comprehensive system health and security status</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Refresh Data'}
        </button>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          title="System Health"
          value={client.status === 'active' ? 'Healthy' : 'Issues'}
          trend={client.status === 'active' ? "positive" : "negative"}
          description={client.status === 'active' ? "All systems operational" : "System has issues"}
          className="bg-white border-l-4 border-l-green-500"
        />
        <StatCard
          icon={<Shield className="w-5 h-5" />}
          title="Security Score"
          value={`${client.security_score || 0}/100`}
          trend={(client.security_score || 0) >= 80 ? "positive" : (client.security_score || 0) >= 60 ? "neutral" : "negative"}
          description={`${runningAntivirus.length} AV products running`}
          className="bg-white border-l-4 border-l-blue-500"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          title="Active Threats"
          value={activeThreats.length.toString()}
          trend={activeThreats.length === 0 ? "positive" : "negative"}
          description={activeThreats.length === 0 ? "No active threats" : `${highSeverityThreats.length} high severity`}
          className="bg-white border-l-4 border-l-orange-500"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          title="Policy Compliance"
          value={compliance ? `${compliance.overall_score}%` : 'N/A'}
          trend={compliance ? (compliance.overall_score >= 80 ? "positive" : compliance.overall_score >= 60 ? "neutral" : "negative") : "neutral"}
          description={compliance ? `${compliance.passed_checks}/${compliance.total_checks} checks passed` : 'Not analyzed'}
          className="bg-white border-l-4 border-l-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            System Information
          </h3>
          <div className="space-y-4">
            <InfoRow label="Hostname" value={client.hostname} icon={<Building className="w-4 h-4" />} />
            <InfoRow label="Unique ID" value={client.unique_id} icon={<FileText className="w-4 h-4" />} />
            <InfoRow label="Operating System" value={`${client.os_name} ${client.os_version}`} icon={<HardDrive className="w-4 h-4" />} />
            <InfoRow label="Architecture" value={client.arch || 'N/A'} icon={<Cpu className="w-4 h-4" />} />
            <InfoRow label="CPU Cores" value={String(client.cpu_cores || 'N/A')} icon={<Cpu className="w-4 h-4" />} />
            <InfoRow label="Total Memory" value={client.total_memory ? formatters.formatBytes(client.total_memory) : 'N/A'} icon={<MemoryStick className="w-4 h-4" />} />
            <InfoRow label="IP Address" value={client.ip_address || 'N/A'} icon={<Globe className="w-4 h-4" />} />
            <InfoRow label="MAC Address" value={client.mac_address || 'N/A'} icon={<CpuIcon className="w-4 h-4" />} />
            <InfoRow label="Last Seen" value={formatters.formatDateTime(client.last_seen)} icon={<Clock className="w-4 h-4" />} />
          </div>
        </div>

        {/* Security & Threat Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Security Overview
          </h3>
          <div className="space-y-4">
            <InfoRow label="Threat Level" value={client.threat_level} icon={<AlertTriangle className="w-4 h-4" />} />
            <InfoRow label="Antivirus Status" value={`${runningAntivirus.length} running`} icon={<Shield className="w-4 h-4" />} />
            <InfoRow label="Security Software" value={`${securitySoftware.length} installed`} icon={<Package className="w-4 h-4" />} />
            <InfoRow label="Total Threats" value={`${data.threats.length} detected`} icon={<ShieldAlert className="w-4 h-4" />} />
            <InfoRow label="High Severity" value={`${highSeverityThreats.length} threats`} icon={<AlertTriangle className="w-4 h-4" />} />
            <InfoRow label="Critical Violations" value={`${criticalViolations.length} policy violations`} icon={<XCircle className="w-4 h-4" />} />
            <InfoRow label="Last Scan" value={data.antivirus[0]?.last_scan ? formatters.getRelativeTime(data.antivirus[0].last_scan) : 'Never'} icon={<Calendar className="w-4 h-4" />} />
            <InfoRow label="Network Adapters" value={`${data.network.length} interfaces`} icon={<Globe className="w-4 h-4" />} />
            <InfoRow label="Software Installed" value={`${data.software.length} applications`} icon={<Package className="w-4 h-4" />} />
          </div>
        </div>
      </div>

     
    </div>
  );
};

// Enhanced SoftwareTab Component
const SoftwareTab: React.FC<{ software: ClientSoftware[] }> = ({ software }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="p-6 border-b border-slate-200">
      <h3 className="font-bold text-slate-900 flex items-center gap-2">
        <Package className="w-5 h-5 text-blue-600" />
        Installed Software ({software.length})
      </h3>
    </div>
    <div className="overflow-hidden">
      {software.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No software found</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {software.map((s, index) => (
            <div key={s.id} className={`flex items-center justify-between p-4 ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{s.software_name}</p>
                  <p className="text-sm text-slate-600 truncate">{s.publisher || 'Unknown Publisher'}</p>
                  {s.install_date && (
                    <p className="text-xs text-slate-500 mt-1">
                      Installed: {formatters.formatDate(s.install_date)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                  v{s.version}
                </span>
                {s.is_security_related && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Security
                  </span>
                )}
                {s.is_vulnerable && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Vulnerable
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// Enhanced AntivirusTab Component
const AntivirusTab: React.FC<{ antivirus: ClientAntivirus[] }> = ({ antivirus }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {antivirus.length === 0 ? (
      <div className="col-span-2 text-center py-12">
        <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No antivirus products found</p>
      </div>
    ) : (
      antivirus.map(av => (
        <div key={av.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${av.is_running ? 'bg-green-100' : 'bg-red-100'}`}>
                <Shield className={`w-6 h-6 ${av.is_running ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{av.software_name}</h4>
                <p className="text-sm text-slate-600">Version {av.version}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${av.is_running ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {av.is_running ? 'ACTIVE' : 'INACTIVE'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${av.is_updated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {av.is_updated ? 'UPDATED' : 'OUTDATED'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div>
                <span className="text-slate-600">Engine:</span>
                <p className="font-semibold text-slate-900">{av.engine_version || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-600">Threats Found:</span>
                <p className="font-semibold text-slate-900">{av.threats_found}</p>
              </div>
              {av.real_time_protection !== undefined && (
                <div>
                  <span className="text-slate-600">Real-time Protection:</span>
                  <p className="font-semibold text-slate-900">{av.real_time_protection ? 'Enabled' : 'Disabled'}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-slate-600">Last Scan:</span>
                <p className="font-semibold text-slate-900">
                  {av.last_scan ? formatters.getRelativeTime(av.last_scan) : 'Never'}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Definition Age:</span>
                <p className="font-semibold text-slate-900">
                  {av.definition_age_days ? `${av.definition_age_days} days` : 'Unknown'}
                </p>
              </div>
              {av.last_scan_status && (
                <div>
                  <span className="text-slate-600">Scan Status:</span>
                  <p className="font-semibold text-slate-900">{av.last_scan_status}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))
    )}
  </div>
);

// Enhanced NetworkTab Component
const NetworkTab: React.FC<{ network: ClientNetworkInfo[] }> = ({ network }) => {
  const [selectedInterface, setSelectedInterface] = useState<ClientNetworkInfo | null>(null);

  useEffect(() => {
    if (network.length > 0 && !selectedInterface) {
      setSelectedInterface(network[0]);
    }
  }, [network, selectedInterface]);

  const getInterfaceType = (interfaceName: string) => {
    const name = interfaceName.toLowerCase();
    if (name.includes('wifi') || name.includes('wireless')) return 'wireless';
    if (name.includes('ethernet') || name.includes('lan')) return 'ethernet';
    if (name.includes('vpn') || name.includes('tunnel')) return 'vpn';
    return 'other';
  };

  const getInterfaceIcon = (type: string) => {
    switch (type) {
      case 'wireless': return <Wifi className="w-5 h-5" />;
      case 'ethernet': return <CableIcon className="w-5 h-5" />;
      case 'vpn': return <Globe className="w-5 h-5" />;
      default: return <Network className="w-5 h-5" />;
    }
  };

  const getInterfaceColor = (type: string) => {
    switch (type) {
      case 'wireless': return 'from-purple-500 to-purple-600';
      case 'ethernet': return 'from-blue-500 to-blue-600';
      case 'vpn': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getConnectionQuality = (interfaceData: ClientNetworkInfo) => {
    if (interfaceData.status === 'down') return 'poor';
    if (interfaceData.ipv4_address && interfaceData.ipv6_address) return 'excellent';
    if (interfaceData.ipv4_address && interfaceData.gateway) return 'good';
    if (interfaceData.ipv4_address) return 'fair';
    return 'poor';
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Interfaces</p>
              <p className="text-2xl font-bold text-slate-900">{network.length}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Connections</p>
              <p className="text-2xl font-bold text-slate-900">
                {network.filter(n => n.status === 'up').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Signal className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">DHCP Enabled</p>
              <p className="text-2xl font-bold text-slate-900">
                {network.filter(n => n.dhcp_enabled).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Router className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Primary Interface</p>
              <p className="text-lg font-bold text-slate-900">
                {network.find(n => n.is_primary)?.interface_name || 'None'}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interface List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Network Interfaces ({network.length})
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {network.length === 0 ? (
                <div className="text-center py-8">
                  <WifiOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No network interfaces found</p>
                </div>
              ) : (
                network.map((ni, index) => {
                  const type = getInterfaceType(ni.interface_name);
                  const quality = getConnectionQuality(ni);
                  const isSelected = selectedInterface?.id === ni.id;
                  
                  return (
                    <div
                      key={ni.id}
                      onClick={() => setSelectedInterface(ni)}
                      className={`p-4 border-b border-slate-100 last:border-b-0 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 bg-gradient-to-br ${getInterfaceColor(type)} rounded-lg flex items-center justify-center`}>
                          {getInterfaceIcon(type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{ni.interface_name}</p>
                          <p className="text-xs text-slate-600 capitalize">{type}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getQualityColor(quality)}`}>
                          {quality}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {ni.ipv4_address && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-slate-600">IPv4:</span>
                            <span className="font-mono text-slate-900 truncate">{ni.ipv4_address}</span>
                          </div>
                        )}
                        {ni.dhcp_enabled && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-slate-600">DHCP</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Interface Details */}
        <div className="lg:col-span-2">
          {selectedInterface ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getInterfaceColor(getInterfaceType(selectedInterface.interface_name))} rounded-xl flex items-center justify-center`}>
                    {getInterfaceIcon(getInterfaceType(selectedInterface.interface_name))}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{selectedInterface.interface_name}</h3>
                    <p className="text-slate-600 capitalize">{getInterfaceType(selectedInterface.interface_name)} Interface</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(getConnectionQuality(selectedInterface))}`}>
                    {getConnectionQuality(selectedInterface).toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedInterface.dhcp_enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedInterface.dhcp_enabled ? 'DHCP' : 'STATIC'}
                  </span>
                </div>
              </div>

              {/* Network Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">Address Configuration</h4>
                  
                  {selectedInterface.ipv4_address && (
                    <DetailCard 
                      icon={<Globe className="w-4 h-4" />}
                      label="IPv4 Address"
                      value={selectedInterface.ipv4_address}
                      type="ip"
                    />
                  )}
                  
                  {selectedInterface.ipv6_address && (
                    <DetailCard 
                      icon={<Globe className="w-4 h-4" />}
                      label="IPv6 Address"
                      value={selectedInterface.ipv6_address}
                      type="ip"
                    />
                  )}
                  
                  {selectedInterface.mac_address && (
                    <DetailCard 
                      icon={<CpuIcon className="w-4 h-4" />}
                      label="MAC Address"
                      value={selectedInterface.mac_address}
                      type="mac"
                    />
                  )}
                  
                  {selectedInterface.gateway && (
                    <DetailCard 
                      icon={<Router className="w-4 h-4" />}
                      label="Default Gateway"
                      value={selectedInterface.gateway}
                      type="ip"
                    />
                  )}

                  {selectedInterface.subnet_mask && (
                    <DetailCard 
                      icon={<Network className="w-4 h-4" />}
                      label="Subnet Mask"
                      value={selectedInterface.subnet_mask}
                      type="ip"
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">Network Services</h4>
                  
                  <DetailCard 
                    icon={<Router className="w-4 h-4" />}
                    label="IP Assignment"
                    value={selectedInterface.dhcp_enabled ? 'Dynamic (DHCP)' : 'Static (Manual)'}
                    type="text"
                  />

                  <DetailCard 
                    icon={<Signal className="w-4 h-4" />}
                    label="Connection Type"
                    value={selectedInterface.connection_type || 'Unknown'}
                    type="text"
                  />
                  
                  {selectedInterface.connection_speed && (
                    <DetailCard 
                      icon={<TrendingUp className="w-4 h-4" />}
                      label="Connection Speed"
                      value={`${selectedInterface.connection_speed} Mbps`}
                      type="text"
                    />
                  )}
                  
                  {selectedInterface.dns_servers && selectedInterface.dns_servers.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-slate-700 mb-2">DNS Servers</h5>
                      <div className="space-y-1">
                        {selectedInterface.dns_servers.map((dns, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-mono text-slate-900">{dns}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Network Information */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-4">Interface Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <StatusIndicator 
                    label="Status"
                    value={selectedInterface.status === 'up' ? 'Up' : 'Down'}
                    status={selectedInterface.status === 'up' ? "success" : "error"}
                    icon={<Signal className="w-4 h-4" />}
                  />
                  <StatusIndicator 
                    label="IP Assigned"
                    value={selectedInterface.ipv4_address || selectedInterface.ipv6_address ? "Yes" : "No"}
                    status={selectedInterface.ipv4_address || selectedInterface.ipv6_address ? "success" : "warning"}
                    icon={<Globe className="w-4 h-4" />}
                  />
                  <StatusIndicator 
                    label="Gateway"
                    value={selectedInterface.gateway ? "Available" : "None"}
                    status={selectedInterface.gateway ? "success" : "warning"}
                    icon={<Router className="w-4 h-4" />}
                  />
                  <StatusIndicator 
                    label="Primary"
                    value={selectedInterface.is_primary ? "Yes" : "No"}
                    status={selectedInterface.is_primary ? "success" : "info"}
                    icon={<Server className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Globe className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a Network Interface</h3>
              <p className="text-slate-500">Choose an interface from the list to view detailed information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ThreatsTab Component
const ThreatsTab: React.FC<{ threats: ClientThreatHistory[] }> = ({ threats }) => (
  <div>
    {threats.length === 0 ? (
      <div className="text-center py-12">
        <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No threat events found</p>
      </div>
    ) : (
      <div className="space-y-3">
        {threats.map(threat => {
          const severityColors = SEVERITY_COLORS[threat.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.info;
          const isResolved = !!threat.resolved_at;
          
          return (
            <div key={threat.id} className={`p-4 border rounded-lg ${severityColors.border} ${severityColors.bg}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className={`font-semibold ${severityColors.text}`}>{threat.threat_name}</p>
                  <p className="text-sm text-gray-600">{threat.threat_type}</p>
                  {threat.process_name && (
                    <p className="text-sm text-gray-600">Process: {threat.process_name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${severityColors.bg} ${severityColors.text}`}>
                    {threat.severity}
                  </span>
                  {isResolved ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      RESOLVED
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>
              {threat.description && <p className="text-sm text-gray-700 mb-2">{threat.description}</p>}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                <p>Detected: {formatters.formatDateTime(threat.detected_at)}</p>
                {threat.resolved_at && <p>Resolved: {formatters.formatDateTime(threat.resolved_at)}</p>}
                {threat.detection_method && <p>Method: {threat.detection_method}</p>}
                {threat.confidence_score && <p>Confidence: {threat.confidence_score}%</p>}
              </div>
              {threat.file_path && (
                <p className="text-xs text-gray-500 mt-2">File: {threat.file_path}</p>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

// PolicyViolationsTab Component
const PolicyViolationsTab: React.FC<{ 
  client: Client; 
  data: ClientDetailData;
  violations: PolicyViolation[];
  compliance: ComplianceStatus | null;
  networkChanges: NetworkChange[];
  onDataRefresh: () => void;
  analyzing: boolean;
}> = ({ client, data, violations, compliance, networkChanges, onDataRefresh, analyzing }) => {
  const [selectedViolation, setSelectedViolation] = useState<PolicyViolation | null>(null);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'antivirus_outdated':
      case 'no_antivirus':
        return <Shield className="w-4 h-4" />;
      case 'os_outdated':
        return <Server className="w-4 h-4" />;
      case 'network_interface_down':
      case 'ip_address_changed':
        return <Network className="w-4 h-4" />;
      case 'unauthorized_software':
        return <Package className="w-4 h-4" />;
      case 'suspicious_process':
        return <Activity className="w-4 h-4" />;
      case 'memory_usage_high':
      case 'cpu_usage_high':
        return <Cpu className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Policy Compliance</h2>
          <p className="text-sm text-slate-600">
            Real-time analysis of client security posture
          </p>
        </div>
        <button
          onClick={onDataRefresh}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>

      {/* Compliance Overview */}
      {compliance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Compliance Score</p>
                <p className={`text-2xl font-bold ${
                  compliance.overall_score >= 90 ? 'text-green-600' :
                  compliance.overall_score >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {compliance.overall_score}%
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {compliance.passed_checks} of {compliance.total_checks} checks passed
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Critical Violations</p>
                <p className="text-2xl font-bold text-red-600">{compliance.critical_violations}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Requires immediate attention
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Network Changes</p>
                <p className="text-2xl font-bold text-blue-600">{networkChanges.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Since last analysis
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Violations</p>
                <p className="text-2xl font-bold text-slate-900">{violations.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              All policy violations
            </div>
          </div>
        </div>
      )}

      {/* Network Changes */}
      {networkChanges.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-600" />
              Recent Network Changes ({networkChanges.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-200">
            {networkChanges.map((change) => (
              <div key={change.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Network className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">{change.interface_name}</h4>
                      <span className="text-sm text-slate-500 capitalize">
                        {change.change_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mt-1">
                      {change.old_ipv4 && (
                        <div>Old IPv4: <span className="font-mono">{change.old_ipv4}</span></div>
                      )}
                      {change.new_ipv4 && (
                        <div>New IPv4: <span className="font-mono">{change.new_ipv4}</span></div>
                      )}
                      {change.old_ipv6 && (
                        <div>Old IPv6: <span className="font-mono">{change.old_ipv6}</span></div>
                      )}
                      {change.new_ipv6 && (
                        <div>New IPv6: <span className="font-mono">{change.new_ipv6}</span></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Violations List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Policy Violations ({violations.length})
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Detected policy violations based on real client data
          </p>
        </div>

        {violations.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Policy Violations</h3>
            <p className="text-slate-500">All policy checks passed successfully</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
            {violations.map((violation) => (
              <div
                key={violation.id}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setSelectedViolation(violation)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getViolationIcon(violation.violation_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{violation.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(violation.severity)}`}>
                        {violation.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{violation.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Detected: {formatters.formatDateTime(violation.detected_at)}</span>
                      <span>Type: {violation.violation_type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Violation Detail Modal */}
      {selectedViolation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getSeverityIcon(selectedViolation.severity)}
                  <h3 className="text-lg font-bold text-slate-900">{selectedViolation.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedViolation(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                <p className="text-slate-700">{selectedViolation.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Evidence</h4>
                <div className="bg-slate-50 rounded-lg p-4">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedViolation.evidence, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Recommendation</h4>
                <p className="text-slate-700">{selectedViolation.recommendation}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Severity:</span>
                  <span className={`ml-2 font-medium ${getSeverityColor(selectedViolation.severity)} px-2 py-1 rounded-full`}>
                    {selectedViolation.severity}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Detected:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {formatters.formatDateTime(selectedViolation.detected_at)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Policy Rule:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {selectedViolation.policy_rule}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Status:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {selectedViolation.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    await policyService.resolveViolation(selectedViolation.id);
                    setSelectedViolation(null);
                    onDataRefresh();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => setSelectedViolation(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ HELPER COMPONENTS ============

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: 'positive' | 'negative' | 'neutral';
  description: string;
  className?: string;
}> = ({ icon, title, value, trend, description, className = '' }) => {
  const trendColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-blue-600'
  };

  return (
    <div className={`rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-slate-600">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${trend === 'positive' ? 'bg-green-500' : trend === 'negative' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
      </div>
      <div className={`text-2xl font-bold mb-1 ${trendColors[trend]}`}>{value}</div>
      <div className="text-xs text-slate-500">{description}</div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
    <div className="flex items-center gap-2 text-slate-600">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <span className="font-semibold text-slate-900 text-sm">{value}</span>
  </div>
);

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
}> = ({ icon, label, onClick, variant }) => {
  const baseClasses = "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md";
  const variantClasses = {
    primary: "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100",
    secondary: "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
  };

  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      <div className="mb-2">{icon}</div>
      <span className="text-sm font-medium text-center">{label}</span>
    </button>
  );
};

const DetailCard: React.FC<{ icon: React.ReactNode; label: string; value: string; type: 'ip' | 'mac' | 'text' }> = ({ 
  icon, label, value, type 
}) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-600">
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
    <span className={`font-medium text-slate-900 ${
      type === 'ip' || type === 'mac' ? 'font-mono text-sm' : ''
    }`}>
      {value}
    </span>
  </div>
);

const StatusIndicator: React.FC<{
  label: string;
  value: string;
  status: 'success' | 'warning' | 'error' | 'info';
  icon: React.ReactNode;
}> = ({ label, value, status, icon }) => {
  const statusColors = {
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  return (
    <div className={`p-3 rounded-lg border-2 ${statusColors[status]}`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
};

export default ClientDetailModal;