import React, { useState, useMemo } from 'react';
import { useClients } from '../hooks/useClients';
import { useAlerts } from '../hooks/useAlerts';
import { useIOCs } from '../hooks/useIOCs';
import { usePolicyViolations } from '../hooks/usePolicyViolations';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/layout/StatCard';
import { DataGrid } from '../components/layout/DataGrid';
import { 
  Activity, 
  AlertTriangle, 
  Shield, 
  Users, 
  RefreshCw,
  Clock,
  Server,
 
  CheckCircle,
  Zap,
  Globe,
 
  ShieldCheck,

  FileText,
  Lock,
 
  BatteryCharging,
  WifiOff,
  Settings
} from 'lucide-react';

interface DashboardPageProps {
  pollIntervals?: {
    alerts: number;
    clients: number;
    iocs: number;
  };
  onNavigate?: (page: string) => void;
  autoRefresh?: boolean;
}

// Chart Components
const DonutChart = ({ percentage, color, label, size = 100 }: { percentage: number; color: string; label: string; size?: number }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-out ${color}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-600 mt-2">{label}</span>
    </div>
  );
};

const HorizontalBarChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">{item.label}</span>
            <span className="font-semibold text-gray-900">{item.value}</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-out rounded-full"
              style={{ 
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                backgroundColor: item.color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const StatusIndicator = ({ status, label }: { status: 'good' | 'warning' | 'critical'; label: string }) => {
  const colors = {
    good: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${colors[status]}`}>
      <div className={`w-2 h-2 rounded-full ${status === 'good' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
      {label}
    </div>
  );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ pollIntervals, onNavigate, autoRefresh = true }) => {
  const { clients, getStats: getClientStats, refresh: refreshClients } = useClients(pollIntervals?.clients);
  const { alerts, getStats: getAlertStats, refresh: refreshAlerts } = useAlerts(true, pollIntervals?.alerts);
  const { iocs, getStats: getIOCStats, refresh: refreshIOCs } = useIOCs(pollIntervals?.iocs);
  const { violations, getStats: getViolationStats, refresh: refreshViolations } = usePolicyViolations();
  
  const [refreshing, setRefreshing] = useState(false);

  const clientStats = getClientStats();
  const alertStats = getAlertStats();
  const iocStats = getIOCStats();
  const violationStats = getViolationStats();

  // Comprehensive metrics calculation
  const metrics = useMemo(() => {
    // Client health metrics
    const healthyClients = clients.filter(c => 
      c.status === 'active' && 
      (c.security_score || 0) >= 80 && 
      (c.compliance_score || 0) >= 80
    ).length;

    const atRiskClients = clients.filter(c => 
      c.status === 'active' && 
      ((c.security_score || 0) < 80 || (c.compliance_score || 0) < 80)
    ).length;

    // Security posture metrics
    const clientsWithFirewall = clients.filter(c => c.firewall_status === 'enabled').length;
    const clientsWithEncryption = clients.filter(c => c.encryption_status === 'enabled').length;
    
    // Threat metrics
    const criticalThreats = clients.filter(c => c.threat_level === 'critical').length;
    const highThreats = clients.filter(c => c.threat_level === 'high').length;
    
    // Compliance metrics
    const avgSecurityScore = clients.reduce((sum, client) => sum + (client.security_score || 0), 0) / Math.max(clients.length, 1);
    const avgComplianceScore = clients.reduce((sum, client) => sum + (client.compliance_score || 0), 0) / Math.max(clients.length, 1);

    return {
      // Client Status
      totalClients: clientStats.total,
      activeClients: clientStats.active,
      disconnectedClients: clientStats.disconnected,
      healthyClients,
      atRiskClients,
      
      // Threat & Security
      openAlerts: alertStats.open,
      criticalAlerts: alertStats.critical,
      totalIOCs: iocStats.total,
      highConfidenceIOCs: iocStats.highConfidence,
      criticalThreats,
      highThreats,
      
      // Compliance & Policy
      policyViolations: violationStats.total,
      criticalViolations: violationStats.by_severity.critical,
      highViolations: violationStats.by_severity.high,
      clientsWithFirewall,
      clientsWithEncryption,
      
      // Scores
      avgSecurityScore: Math.round(avgSecurityScore),
      avgComplianceScore: Math.round(avgComplianceScore),
      overallHealthScore: Math.round((healthyClients / Math.max(clientStats.total, 1)) * 100)
    };
  }, [clients, clientStats, alertStats, iocStats, violationStats]);

  // Threat distribution data
  const threatDistribution = useMemo(() => [
    { label: 'Critical', value: clients.filter(c => c.threat_level === 'critical').length, color: '#ef4444' },
    { label: 'High', value: clients.filter(c => c.threat_level === 'high').length, color: '#f97316' },
    { label: 'Medium', value: clients.filter(c => c.threat_level === 'medium').length, color: '#eab308' },
    { label: 'Low', value: clients.filter(c => c.threat_level === 'low').length, color: '#3b82f6' }
  ], [clients]);

  // Policy violation distribution
  const violationDistribution = useMemo(() => [
    { label: 'Critical', value: violationStats.by_severity.critical, color: '#ef4444' },
    { label: 'High', value: violationStats.by_severity.high, color: '#f97316' },
    { label: 'Medium', value: violationStats.by_severity.medium, color: '#eab308' },
    { label: 'Low', value: violationStats.by_severity.low, color: '#3b82f6' }
  ], [violationStats]);

  // Security posture data
  const securityPosture = useMemo(() => [
    { label: 'Firewall Enabled', value: metrics.clientsWithFirewall, total: metrics.totalClients, color: '#10b981', icon: Shield },
    { label: 'Disk Encryption', value: metrics.clientsWithEncryption, total: metrics.totalClients, color: '#3b82f6', icon: Lock },
    { label: 'AV Protection', value: clients.filter(c => c.status === 'active').length, total: metrics.totalClients, color: '#8b5cf6', icon: ShieldCheck },
    { label: 'Compliant', value: metrics.healthyClients, total: metrics.totalClients, color: '#06b6d4', icon: CheckCircle }
  ], [metrics, clients]);

  // Recent high severity alerts
  const recentCriticalAlerts = useMemo(() => {
    return alerts
      .filter(alert => alert.severity === 'critical' || alert.severity === 'high')
      .slice(0, 5);
  }, [alerts]);

  // Top policy violation types
  const topViolationTypes = useMemo(() => {
    const types = violations.reduce((acc, violation) => {
      acc[violation.violation_type] = (acc[violation.violation_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(types)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }, [violations]);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshClients(),
        refreshAlerts(),
        refreshIOCs(),
        refreshViolations()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const getOverallStatus = () => {
    if (metrics.criticalAlerts > 0 || metrics.criticalThreats > 0) return 'critical';
    if (metrics.openAlerts > 0 || metrics.highThreats > 0) return 'warning';
    return 'good';
  };

  const overallStatus = getOverallStatus();
  const statusLabels = {
    good: 'All Systems Normal',
    warning: 'Attention Required',
    critical: 'Critical Issues Detected'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header with Live Monitoring Status */}
        <PageHeader
          title="Security Dashboard"
          description="Security monitoring and threat intelligence dashboard"
          icon={<ShieldCheck className="w-8 h-8 text-white" />}
          gradient={
            overallStatus === 'critical' ? 'bg-gradient-to-r from-slate-900 via-red-900 to-slate-900' :
            overallStatus === 'warning' ? 'bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900' :
            'bg-gradient-to-r from-slate-900 via-green-900 to-slate-900'
          }
          action={
            <div className="flex items-center gap-4">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm border ${
                autoRefresh 
                  ? 'bg-green-500/20 border-green-500/30 text-green-100' 
                  : 'bg-gray-500/20 border-gray-500/30 text-gray-100'
              }`}>
                <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">
                  {autoRefresh ? 'Live Monitoring' : 'Monitoring Stopped'}
                </span>
              </div>
              <button
                onClick={handleRefreshAll}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200 disabled:opacity-50 border border-white/20"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh All</span>
              </button>
            </div>
          }
        />

      {/* Minimalist Status Banner */}
<button 
  onClick={() => handleNavigation('alerts')}
  className="w-full text-left p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer group"
>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      {/* Status Dot */}
      <div className="relative">
        <div className={`w-4 h-4 rounded-full ${
          overallStatus === 'critical' ? 'bg-red-500 animate-pulse' :
          overallStatus === 'warning' ? 'bg-orange-500' :
          'bg-green-500'
        }`} />
        {overallStatus === 'critical' && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping" />
        )}
      </div>

      {/* Status Text */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {statusLabels[overallStatus]}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span><strong className="text-gray-900">{metrics.openAlerts}</strong> alerts</span>
          <span><strong className="text-red-600">{metrics.criticalThreats}</strong> critical threats</span>
          <span><strong className="text-orange-600">{metrics.highThreats}</strong> high threats</span>
          {metrics.policyViolations > 0 && (
            <span><strong className="text-purple-600">{metrics.policyViolations}</strong> violations</span>
          )}
        </div>
      </div>
    </div>

    <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </div>
</button>
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div onClick={() => handleNavigation('clients')} className="cursor-pointer">
            <StatCard
              title="Total Systems"
              value={metrics.totalClients}
              icon={<Server className="w-4 h-4" />}
              color="blue"
              subtitle={`${metrics.activeClients} active`}
            />
          </div>
          <div onClick={() => handleNavigation('alerts')} className="cursor-pointer">
            <StatCard
              title="Active Alerts"
              value={metrics.openAlerts}
              icon={<AlertTriangle className="w-4 h-4" />}
              color="red"
              subtitle={`${metrics.criticalAlerts} critical`}
            />
          </div>
          <div onClick={() => handleNavigation('threats')} className="cursor-pointer">
            <StatCard
              title="Critical Threats"
              value={metrics.criticalThreats}
              icon={<Zap className="w-4 h-4" />}
              color="orange"
              subtitle={`${metrics.highThreats} high`}
            />
          </div>
          <div onClick={() => handleNavigation('iocs')} className="cursor-pointer">
            <StatCard
              title="IOC Indicators"
              value={metrics.totalIOCs}
              icon={<Shield className="w-4 h-4" />}
              color="purple"
              subtitle={`${metrics.highConfidenceIOCs} high confidence`}
            />
          </div>
          
          <div className="cursor-pointer">
            <StatCard
              title="Health Score"
              value={`${metrics.overallHealthScore}%`}
              icon={<Activity className="w-4 h-4" />}
              color="green"
              subtitle={`${metrics.healthyClients} healthy systems`}
            />
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Security Overview */}
          <div className="xl:col-span-2 space-y-8">
            {/* Threat & Compliance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Threat Distribution */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Threat Distribution</h3>
                <HorizontalBarChart data={threatDistribution} />
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Systems Monitored</span>
                    <span className="font-semibold text-gray-900">{metrics.totalClients}</span>
                  </div>
                </div>
              </div>

              {/* Compliance Scores */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Overview</h3>
                <div className="flex justify-around">
                  <DonutChart 
                    percentage={metrics.avgSecurityScore} 
                    color="text-blue-500" 
                    label="Security Score"
                    size={120}
                  />
                  <DonutChart 
                    percentage={metrics.avgComplianceScore} 
                    color="text-green-500" 
                    label="Compliance Score"
                    size={120}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{metrics.healthyClients}</div>
                    <div className="text-xs text-blue-600">Healthy Systems</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{metrics.atRiskClients}</div>
                    <div className="text-xs text-orange-600">At Risk</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Posture & Policy Violations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Posture */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Posture</h3>
                <div className="space-y-4">
                  {securityPosture.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white border">
                          <item.icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{item.value}</div>
                        <div className="text-xs text-gray-500">of {item.total}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policy Violations */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Policy Violations</h3>
                  <button 
                    onClick={() => handleNavigation('policy')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View All →
                  </button>
                </div>
                <HorizontalBarChart data={violationDistribution} />
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">Top Violation Types</h4>
                  {topViolationTypes.map(({ type, count }) => (
                    <div key={type} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600 capitalize">{type.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Critical Alerts */}
            <DataGrid
              title="Recent Critical Alerts"
              description="High severity incidents requiring immediate attention"
            >
              <div className="space-y-3">
                {recentCriticalAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-4 border border-red-200 bg-red-50 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => handleNavigation('alerts')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2 leading-relaxed">
                        {alert.title}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold whitespace-nowrap ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-orange-100 text-orange-800 border border-orange-200'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600 line-clamp-1 flex-1 pr-2">
                        {alert.description || 'No description available'}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {recentCriticalAlerts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">No critical alerts</p>
                    <p className="text-xs text-gray-400 mt-1">All systems are secure</p>
                  </div>
                )}
              </div>
            </DataGrid>
          </div>

          {/* Right Column - System Insights */}
          <div className="space-y-8">
            {/* System Status Overview */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">System Status Overview</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Active Systems</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{metrics.activeClients}</div>
                    <div className="text-xs text-gray-500">{Math.round((metrics.activeClients / metrics.totalClients) * 100)}% online</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <WifiOff className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Disconnected</span>
                  </div>
                  <div className="text-lg font-bold text-orange-600">{metrics.disconnectedClients}</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Protected Assets</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{metrics.totalClients}</div>
                    <div className="text-xs text-gray-500">100% coverage</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BatteryCharging className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Overall Health</span>
                  </div>
                  <StatusIndicator status={overallStatus} label={`${metrics.overallHealthScore}%`} />
                </div>
              </div>
            </div>

  {/* Glass Morphism Quick Actions */}
<div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl p-6">
  <div className="flex items-center gap-3 mb-6">
    <div className="w-12 h-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-200/50 flex items-center justify-center backdrop-blur-sm">
      <Zap className="w-6 h-6 text-blue-600" />
    </div>
    <div>
      <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
      <p className="text-sm text-gray-600/80">Navigate instantly to key sections</p>
    </div>
  </div>
  
  <div className="grid grid-cols-2 gap-4">
    {[
      { 
        label: 'Systems', 
        subtitle: `${metrics.activeClients} active`, 
        icon: Server, 
        color: 'blue',
        onClick: () => handleNavigation('clients')
      },
      { 
        label: 'Alerts', 
        subtitle: `${metrics.openAlerts} active`, 
        icon: AlertTriangle, 
        color: 'red',
        onClick: () => handleNavigation('alerts')
      },
      { 
        label: 'Violations', 
        subtitle: `${metrics.policyViolations} total`, 
        icon: FileText, 
        color: 'orange',
        onClick: () => handleNavigation('policy')
      },
      { 
        label: 'Settings', 
        subtitle: 'Configure', 
        icon: Settings, 
        color: 'purple',
        onClick: () => handleNavigation('settings')
      }
    ].map((action, index) => (
      <button
        key={index}
        className="group relative p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/60 hover:border-white/80 hover:bg-white/70 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
        onClick={action.onClick}
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <div className={`w-12 h-12 bg-gradient-to-br from-${action.color}-500/20 to-${action.color}-600/20 rounded-xl border border-${action.color}-200/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm`}>
            <action.icon className={`w-6 h-6 text-${action.color}-600`} />
          </div>
          <div>
            <div className={`text-sm font-semibold text-gray-800 group-hover:text-${action.color}-700 transition-colors`}>
              {action.label}
            </div>
            <div className="text-xs text-gray-500/80">{action.subtitle}</div>
          </div>
        </div>
      </button>
    ))}
  </div>


  {/* Quick Stats Footer */}
  <div className="mt-6 pt-6 border-t border-gray-200/50">
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <div className="text-lg font-bold text-blue-600">{metrics.activeClients}</div>
        <div className="text-xs text-gray-500">Active</div>
      </div>
      <div>
        <div className="text-lg font-bold text-green-600">{metrics.healthyClients}</div>
        <div className="text-xs text-gray-500">Healthy</div>
      </div>
      <div>
        <div className="text-lg font-bold text-orange-600">{metrics.atRiskClients}</div>
        <div className="text-xs text-gray-500">At Risk</div>
      </div>
    </div>
  </div>
</div>

            {/* IOC Sources */}
            <DataGrid
              title="Threat Intelligence"
              description="Active IOC sources and indicators"
            >
              <div className="space-y-3">
                {iocStats.bySource && Object.entries(iocStats.bySource).slice(0, 5).map(([source, count]) => (
                  <div 
                    key={source}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                    onClick={() => handleNavigation('iocs')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{source}</span>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                      {count as number}
                    </span>
                  </div>
                ))}
                {(!iocStats.bySource || Object.keys(iocStats.bySource).length === 0) && (
                  <div className="text-center py-6 text-gray-500">
                    <Globe className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No active IOC sources</p>
                  </div>
                )}
              </div>
            </DataGrid>
          </div>
        </div>
      </div>
    </div>
  );
};