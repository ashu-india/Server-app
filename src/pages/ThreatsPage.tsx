import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { clientService } from '../services/clientService';
import api from '../services/api';
import { formatters } from '../utils/formatters';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/layout/StatCard';
import { DataGrid } from '../components/layout/DataGrid';
import { SearchFilters } from '../components/layout/SearchFilters';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Target, 
  RefreshCw,
  Clock,
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Table,
  Grid,
  User,
  Calendar,
  FileText,
  Cpu,
  Network,
  HardDrive,
  Code,
  Database,
  Globe,
  Activity,
  Copy,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface Client {
  id: string;
  hostname: string;
  threat_level?: string;
  os_name?: string;
  ip_address?: string;
}

interface Threat {
  id: string;
  client_id: string;
  threat_name: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  threat_type: string;
  description?: string;
  detected_at: string;
  file_path?: string;
  process_name?: string;
  confidence_score?: number;
  mitigation_action?: string;
  ioc_matches?: string;
  metadata?: Record<string, unknown>;
}

interface ThreatsPageProps {
  pollIntervals?: {
    alerts: number;
    clients: number;
    iocs: number;
  };
}

type ViewType = 'table' | 'cards';

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}> = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
      <div className="text-sm text-gray-700">
        Showing {startItem}-{endItem} of {totalItems} threats
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                currentPage === pageNum
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Threat Detail Modal Component
interface ThreatDetailModalProps {
  threat: Threat;
  client?: Client;
  isOpen: boolean;
  onClose: () => void;
}

const ThreatDetailModal: React.FC<ThreatDetailModalProps> = ({ 
  threat, 
  client, 
  isOpen, 
  onClose 
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getSeverityGradient = (severity: string) => {
    const gradients = {
      critical: 'from-red-500 to-red-600',
      high: 'from-orange-500 to-orange-600',
      medium: 'from-yellow-500 to-yellow-600',
      low: 'from-blue-500 to-blue-600',
      info: 'from-gray-500 to-gray-600'
    };
    return gradients[severity as keyof typeof gradients] || gradients.info;
  };

  const getThreatTypeIcon = (type: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      malware: <Cpu className="w-5 h-5" />,
      ransomware: <FileText className="w-5 h-5" />,
      phishing: <Globe className="w-5 h-5" />,
      exploit: <Code className="w-5 h-5" />,
      network: <Network className="w-5 h-5" />,
      process: <Activity className="w-5 h-5" />,
      registry: <Database className="w-5 h-5" />,
      file: <HardDrive className="w-5 h-5" />,
    };
    return icons[type.toLowerCase()] || <AlertTriangle className="w-5 h-5" />;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderField = (label: string, value: any, icon?: React.ReactNode) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
      {icon && <div className="w-5 h-5 text-gray-400 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
        <div className="text-sm text-gray-900 break-words">
          {value || <span className="text-gray-400">Not specified</span>}
        </div>
      </div>
    </div>
  );

  const renderMetadata = (metadata: Record<string, unknown>) => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return <span className="text-gray-400">No metadata available</span>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">{key}:</span>
            <span className="text-sm text-gray-900">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const threatInfo = {
    critical: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      description: 'Immediate threat requiring urgent attention and remediation'
    },
    high: {
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      description: 'Significant threat requiring prompt investigation and action'
    },
    medium: {
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      description: 'Moderate threat requiring monitoring and assessment'
    },
    low: {
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      description: 'Low-level threat for awareness and tracking'
    },
    info: {
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      description: 'Informational detection for situational awareness'
    }
  };

  const currentThreatInfo = threatInfo[threat.severity] || threatInfo.info;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl transform animate-in slide-in-from-bottom-10 duration-300">
        {/* Header */}
        <div className={`relative bg-gradient-to-r ${getSeverityGradient(threat.severity)} p-8`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                {getThreatTypeIcon(threat.threat_type)}
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2">{threat.threat_name}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm capitalize">
                    {threat.severity} Severity
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                    {threat.threat_type}
                  </span>
                  {threat.confidence_score && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                      {threat.confidence_score}% Confidence
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
            >
              <X className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Threat Details */}
            <div className="xl:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Threat Information
                </h3>
                <div className="space-y-3">
                  {renderField('Threat Name', threat.threat_name, <AlertTriangle className="w-4 h-4" />)}
                  {renderField('Threat Type', threat.threat_type, getThreatTypeIcon(threat.threat_type))}
                  {renderField('Description', threat.description, <FileText className="w-4 h-4" />)}
                  {threat.file_path && renderField('File Path', threat.file_path, <HardDrive className="w-4 h-4" />)}
                  {threat.process_name && renderField('Process Name', threat.process_name, <Cpu className="w-4 h-4" />)}
                </div>
              </div>

              {/* Threat Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Threat Level
                  </h3>
                  <div className={`p-4 rounded-xl border-2 ${currentThreatInfo.border} ${currentThreatInfo.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-lg font-bold capitalize ${currentThreatInfo.color}`}>
                        {threat.severity}
                      </span>
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getSeverityGradient(threat.severity)}`} />
                    </div>
                    <p className="text-sm text-gray-600">
                      {currentThreatInfo.description}
                    </p>
                  </div>
                </div>

                {threat.confidence_score && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                      Confidence Score
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Detection Accuracy</span>
                        <span className={`text-xl font-bold ${
                          threat.confidence_score >= 80 ? 'text-emerald-700' :
                          threat.confidence_score >= 60 ? 'text-amber-700' :
                          'text-red-700'
                        }`}>
                          {threat.confidence_score}%
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${
                            threat.confidence_score >= 80 ? 'from-green-500 to-emerald-500' :
                            threat.confidence_score >= 60 ? 'from-yellow-500 to-amber-500' :
                            'from-red-500 to-orange-500'
                          }`}
                          style={{ width: `${threat.confidence_score}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Client Information */}
              {client && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    Affected Client
                  </h3>
                  <div className="space-y-3">
                    {renderField('Hostname', client.hostname, <User className="w-4 h-4" />)}
                    {renderField('IP Address', client.ip_address, <Globe className="w-4 h-4" />)}
                    {renderField('Operating System', client.os_name, <Cpu className="w-4 h-4" />)}
                    {renderField('Threat Level', client.threat_level, <AlertTriangle className="w-4 h-4" />)}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Metadata & Actions */}
            <div className="space-y-6">
              {/* Timeline */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Timeline
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Detected</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatters.formatDate(threat.detected_at)}</p>
                      <p className="text-xs text-gray-500">{formatters.getRelativeTime(threat.detected_at)}</p>
                    </div>
                  </div>
                  
                  {threat.mitigation_action && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Mitigation</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {threat.mitigation_action}
                      </span>
                    </div>
                  )}

                  {threat.ioc_matches && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">IOC Matches</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {threat.ioc_matches}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              {threat.metadata && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-green-600" />
                    Technical Details
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    {renderMetadata(threat.metadata)}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => copyToClipboard(threat.threat_name)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm justify-center"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Threat Name'}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm justify-center">
                    <ExternalLink className="w-4 h-4" />
                    Search Intelligence
                  </button>
                  {client && (
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 transition-all duration-200 font-medium shadow-sm justify-center">
                      <User className="w-4 h-4" />
                      View Client Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ThreatsPage: React.FC<ThreatsPageProps> = ({ pollIntervals }) => {
  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [allThreats, setAllThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hours, setHours] = useState<number>(24);
  const [severity, setSeverity] = useState<string>('all');
  const [clientId, setClientId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewType, setViewType] = useState<ViewType>('table');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const ITEMS_PER_PAGE = 12;

  // Load clients from clientService
  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await clientService.getClients();
        setClients(Array.isArray(clientsData) ? clientsData : []);
      } catch (error) {
        console.error('Failed to load clients:', error);
        setClients([]);
      }
    };

    loadClients();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const highThreatClients = clients.filter(c => c.threat_level === 'high').length;
    const detections = allThreats.length;
    const campaigns = Array.from(new Set(allThreats.map(r => r.threat_type))).length;
    
    return { totalClients, highThreatClients, detections, campaigns };
  }, [clients, allThreats]);

  // Load threats
  const loadThreats = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { hours, page: 1, pageSize: 1000 };
      if (severity && severity !== 'all') params.severity = severity;
      if (clientId && clientId !== 'all') params.client_id = clientId;
      
      const queryString = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      
      const res = await api.get(`/api/threats/recent?${queryString}`);
      
      if (res && res.items) {
        const threats = Array.isArray(res.items) ? res.items : [];
        setAllThreats(threats);
      } else {
        setAllThreats([]);
      }
    } catch (err) {
      console.error('Failed to load threats:', err);
      setAllThreats([]);
    } finally {
      setLoading(false);
    }
  }, [hours, severity, clientId]);

  useEffect(() => {
    loadThreats();
  }, [loadThreats]);

  // Client-side filtering for search
  const filteredThreats = useMemo(() => {
    let result = allThreats;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(threat =>
        threat.threat_name?.toLowerCase().includes(query) ||
        threat.threat_type?.toLowerCase().includes(query) ||
        threat.description?.toLowerCase().includes(query) ||
        threat.severity?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allThreats, searchQuery]);

  // Paginate the filtered results
  const paginatedThreats = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredThreats.slice(startIndex, endIndex);
  }, [filteredThreats, currentPage, ITEMS_PER_PAGE]);

  // Get client for a threat
  const getClientForThreat = (threat: Threat) => {
    return clients.find(client => client.id === threat.client_id);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle filter changes
  const handleHoursChange = (value: number) => {
    setHours(value);
    setCurrentPage(1);
  };

  const handleSeverityChange = (value: string) => {
    setSeverity(value);
    setCurrentPage(1);
  };

  const handleClientChange = (value: string) => {
    setClientId(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleThreatClick = (threat: Threat) => {
    setSelectedThreat(threat);
    setShowDetailModal(true);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredThreats.length / ITEMS_PER_PAGE);

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      info: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[severity as keyof typeof colors] || colors.info;
  };

  const getSeverityGradient = (severity: string) => {
    const gradients = {
      critical: 'from-red-500 to-red-600',
      high: 'from-orange-500 to-orange-600',
      medium: 'from-yellow-500 to-yellow-600',
      low: 'from-blue-500 to-blue-600',
      info: 'from-gray-500 to-gray-600'
    };
    return gradients[severity as keyof typeof gradients] || gradients.info;
  };

  const getThreatTypeIcon = (type: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      malware: <Cpu className="w-4 h-4" />,
      ransomware: <FileText className="w-4 h-4" />,
      phishing: <Globe className="w-4 h-4" />,
      exploit: <Code className="w-4 h-4" />,
      network: <Network className="w-4 h-4" />,
      process: <Activity className="w-4 h-4" />,
    };
    return icons[type.toLowerCase()] || <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <PageHeader
          title="Threat Hunting"
          description="Analyze threat data and hunt for suspicious patterns across your infrastructure"
          icon={<Shield className="w-6 h-6 text-blue-300" />}
          gradient="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900"
          action={
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Active Analysis</span>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Clients"
            value={stats.totalClients}
            icon={<Users className="w-4 h-4" />}
            color="blue"
          />
          <StatCard
            title="High Threat"
            value={stats.highThreatClients}
            icon={<AlertTriangle className="w-4 h-4" />}
            color="red"
          />
          <StatCard
            title="Detections"
            value={stats.detections}
            icon={<Target className="w-4 h-4" />}
            color="orange"
          />
          <StatCard
            title="Campaigns"
            value={stats.campaigns}
            icon={<BarChart3 className="w-4 h-4" />}
            color="purple"
          />
        </div>

        <DataGrid
          title="Threat Events"
          description={
            searchQuery 
              ? `${paginatedThreats.length} of ${filteredThreats.length} events match your search`
              : `${filteredThreats.length} events analyzed`
          }
          action={
            <div className="flex gap-3">
              {/* View Toggle */}
              <div className="flex bg-white border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewType('table')}
                  className={`p-2 rounded-md transition-colors ${
                    viewType === 'table' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Table className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewType('cards')}
                  className={`p-2 rounded-md transition-colors ${
                    viewType === 'cards' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={loadThreats}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh</span>
              </button>
            </div>
          }
          filters={
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              searchPlaceholder="Search threats by name, type, description, or severity..."
              filters={[
                {
                  value: hours.toString(),
                  onChange: (value) => handleHoursChange(Number(value)),
                  options: [
                    { value: '1', label: 'Last 1 hour' },
                    { value: '6', label: 'Last 6 hours' },
                    { value: '24', label: 'Last 24 hours' },
                    { value: '168', label: 'Last 7 days' },
                    { value: '720', label: 'Last 30 days' }
                  ],
                  label: 'Time Range'
                },
                {
                  value: severity,
                  onChange: handleSeverityChange,
                  options: [
                    { value: 'all', label: 'All Severity' },
                    { value: 'critical', label: 'Critical' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                    { value: 'info', label: 'Info' }
                  ],
                  label: 'Severity'
                },
                {
                  value: clientId,
                  onChange: handleClientChange,
                  options: [
                    { value: 'all', label: 'All Clients' },
                    ...clients.map(client => ({
                      value: client.id,
                      label: client.hostname
                    }))
                  ],
                  label: 'Client'
                }
              ]}
            />
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : paginatedThreats.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                {searchQuery ? 'No threats match your search' : 'No threat events found'}
              </p>
              {searchQuery && (
                <p className="text-gray-500 text-sm mt-1">Try adjusting your search terms or filters</p>
              )}
            </div>
          ) : viewType === 'table' ? (
            <>
              {/* Table View */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Threat</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Type</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Client</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Severity</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Detected</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedThreats.map((threat, idx) => {
                      const client = getClientForThreat(threat);
                      return (
                        <tr 
                          key={`${threat.id || idx}-${threat.client_id}`} 
                          className="border-b border-gray-100 hover:bg-blue-50/30 transition-all duration-200 group cursor-pointer"
                          onClick={() => handleThreatClick(threat)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getThreatTypeIcon(threat.threat_type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                                  {threat.threat_name || 'Unnamed Threat'}
                                </p>
                                {threat.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                    {formatters.truncateText(threat.description, 60)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold border border-blue-200">
                              {getThreatTypeIcon(threat.threat_type)}
                              {threat.threat_type}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <User className="w-4 h-4 text-gray-400" />
                              {client?.hostname || 'Unknown Client'}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getSeverityColor(threat.severity).split(' ')[0]} shadow-sm`} />
                              <span className={`text-sm font-semibold capitalize px-2 py-1 rounded-full ${getSeverityColor(threat.severity)}`}>
                                {threat.severity}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {formatters.getRelativeTime(threat.detected_at)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleThreatClick(threat);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                              title="View Threat Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Table */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredThreats.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </>
          ) : (
            <>
              {/* Card View */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {paginatedThreats.map((threat, idx) => {
                  const client = getClientForThreat(threat);
                  return (
                    <div
                      key={`${threat.id || idx}-${threat.client_id}`}
                      className="bg-white rounded-2xl border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer group overflow-hidden"
                      onClick={() => handleThreatClick(threat)}
                    >
                      {/* Header with severity gradient */}
                      <div className={`bg-gradient-to-r ${getSeverityGradient(threat.severity)} p-4`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                              {getThreatTypeIcon(threat.threat_type)}
                            </div>
                            <span className="text-white font-semibold text-sm capitalize">
                              {threat.severity}
                            </span>
                          </div>
                          <div className="text-white/80 text-xs font-medium">
                            {threat.threat_type}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-4">
                        {/* Threat Name */}
                        <div>
                          <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-900 transition-colors line-clamp-2">
                            {threat.threat_name || 'Unnamed Threat'}
                          </p>
                          {threat.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {threat.description}
                            </p>
                          )}
                        </div>

                        {/* Client and Confidence */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Client</span>
                            <span className="font-medium text-gray-700">{client?.hostname || 'Unknown'}</span>
                          </div>
                          
                          {threat.confidence_score && (
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-500">Confidence</span>
                                <span className={`font-bold ${
                                  threat.confidence_score >= 80 ? 'text-emerald-700' :
                                  threat.confidence_score >= 60 ? 'text-amber-700' :
                                  'text-red-700'
                                }`}>
                                  {threat.confidence_score}%
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${
                                    threat.confidence_score >= 80 ? 'from-green-500 to-emerald-500' :
                                    threat.confidence_score >= 60 ? 'from-yellow-500 to-amber-500' :
                                    'from-red-500 to-orange-500'
                                  }`}
                                  style={{ width: `${threat.confidence_score}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatters.getRelativeTime(threat.detected_at)}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleThreatClick(threat);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination for Cards */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredThreats.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </>
          )}
        </DataGrid>

        {/* Threat Detail Modal */}
        {selectedThreat && (
          <ThreatDetailModal
            threat={selectedThreat}
            client={getClientForThreat(selectedThreat)}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </div>
    </div>
  );
};