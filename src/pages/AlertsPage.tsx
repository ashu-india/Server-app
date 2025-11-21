import React, { useState, useMemo } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { alertService } from '../services/alertService';
import { formatters } from '../utils/formatters';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/layout/StatCard';
import { DataGrid } from '../components/layout/DataGrid';
import { SearchFilters } from '../components/layout/SearchFilters';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Check,
  XCircle,
  Bell,
  Eye,
  Table,
  Grid,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Calendar,
  FileText,
  Shield,
  Network,
  Cpu,
  HardDrive,
  AlertCircle,
  CheckSquare,
  Square,
  CheckSquareIcon,
  Activity,
  CheckCircle2,
  Copy,
  ExternalLink,
  Target
} from 'lucide-react';

type FilterStatus = 'all' | 'open' | 'acknowledged' | 'resolved';
type ViewType = 'table' | 'cards';
type SelectionType = 'none' | 'page' | 'all';

interface AlertsPageProps {
  pollIntervals?: {
    alerts: number;
    clients: number;
    iocs: number;
  };
  enabled?: boolean;
  settings?: Record<string, unknown>;
}

interface AlertDetailModalProps {
  alert: any;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}



interface AlertDetailModalProps {
  alert: any;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}

const AlertDetailModal: React.FC<AlertDetailModalProps> = ({ 
  alert, 
  isOpen, 
  onClose, 
  onAcknowledge, 
  onResolve 
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !alert) return null;

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

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-red-100 text-red-800 border-red-200',
      acknowledged: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      false_positive: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      open: <AlertTriangle className="w-4 h-4" />,
      acknowledged: <Clock className="w-4 h-4" />,
      resolved: <CheckCircle2 className="w-4 h-4" />,
      false_positive: <X className="w-4 h-4" />
    };
    return icons[status as keyof typeof icons] || <Bell className="w-4 h-4" />;
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

  const getAlertLevelInfo = (severity: string) => {
    const info = {
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
        description: 'Informational alert for situational awareness'
      }
    };
    return info[severity as keyof typeof info] || info.info;
  };

  const alertLevelInfo = getAlertLevelInfo(alert.severity);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl transform animate-in slide-in-from-bottom-10 duration-300">
        {/* Header */}
        <div className={`relative bg-gradient-to-r ${getSeverityGradient(alert.severity)} p-8`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2">{alert.title}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm capitalize">
                    {alert.severity} Severity
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-1">
                    {getStatusIcon(alert.status)}
                    {alert.status}
                  </span>
                  {alert.violation_type && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                      {alert.violation_type}
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
            {/* Left Column - Alert Details */}
            <div className="xl:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Alert Information
                  </h3>
                  <button
                    onClick={() => copyToClipboard(alert.title)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="space-y-3">
                  {renderField('Title', alert.title, <FileText className="w-4 h-4" />)}
                  {renderField('Description', alert.description, <FileText className="w-4 h-4" />)}
                  {renderField('Client ID', alert.client_id, <User className="w-4 h-4" />)}
                  {renderField('Assigned To', alert.assigned_to, <User className="w-4 h-4" />)}
                </div>
              </div>

              {/* Alert Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Alert Level
                  </h3>
                  <div className={`p-4 rounded-xl border-2 ${alertLevelInfo.border} ${alertLevelInfo.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-lg font-bold capitalize ${alertLevelInfo.color}`}>
                        {alert.severity}
                      </span>
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getSeverityGradient(alert.severity)}`} />
                    </div>
                    <p className="text-sm text-gray-600">
                      {alertLevelInfo.description}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    Policy Information
                  </h3>
                  <div className="space-y-3">
                    {renderField('Violation Type', alert.violation_type, <Shield className="w-4 h-4" />)}
                    {renderField('Policy Rule', alert.policy_rule, <Shield className="w-4 h-4" />)}
                    {renderField('Automatic Resolution', alert.automatic_resolution ? 'Enabled' : 'Disabled', <Cpu className="w-4 h-4" />)}
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-green-600" />
                  Technical Details
                </h3>
                <div className="space-y-3">
                  {renderField('IOC ID', alert.ioc_id, <Target className="w-4 h-4" />)}
                  {renderField('Automatic Resolution', alert.automatic_resolution ? 'Yes' : 'No', <Cpu className="w-4 h-4" />)}
                  {renderField('Violation Type', alert.violation_type, <Shield className="w-4 h-4" />)}
                </div>
              </div>
            </div>

            {/* Right Column - Timeline & Actions */}
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
                      <Activity className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Detected</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatters.formatDateTime(alert.detected_at)}</p>
                      <p className="text-xs text-gray-500">{formatters.getRelativeTime(alert.detected_at)}</p>
                    </div>
                  </div>
                  
                  {alert.acknowledged_at && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Acknowledged</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatters.formatDateTime(alert.acknowledged_at)}</p>
                        <p className="text-xs text-gray-500">{formatters.getRelativeTime(alert.acknowledged_at)}</p>
                      </div>
                    </div>
                  )}

                  {alert.resolved_at && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Resolved</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatters.formatDateTime(alert.resolved_at)}</p>
                        <p className="text-xs text-gray-500">{formatters.getRelativeTime(alert.resolved_at)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Created</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatters.formatDateTime(alert.created_at)}</p>
                      <p className="text-xs text-gray-500">{formatters.getRelativeTime(alert.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Last Updated</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatters.formatDateTime(alert.updated_at)}</p>
                      <p className="text-xs text-gray-500">{formatters.getRelativeTime(alert.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {alert.metadata && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-indigo-600" />
                    Metadata
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    {renderMetadata(alert.metadata)}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => copyToClipboard(alert.title)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm justify-center"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Alert Title'}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm justify-center">
                    <ExternalLink className="w-4 h-4" />
                    Investigate Further
                  </button>
                  {alert.client_id && (
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-100 transition-all duration-200 font-medium shadow-sm justify-center">
                      <User className="w-4 h-4" />
                      View Client Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Alert Management Actions */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Alert Management</h3>
            <div className="flex flex-wrap gap-4">
              {alert.status === 'open' && (
                <>
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Acknowledge Alert
                  </button>
                  <button
                    onClick={() => onResolve(alert.id)}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Resolve Alert
                  </button>
                </>
              )}
              {alert.status === 'acknowledged' && (
                <button
                  onClick={() => onResolve(alert.id)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Resolve Alert
                </button>
              )}
              {(alert.status === 'resolved' || alert.status === 'false_positive') && (
                <div className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Alert {alert.status === 'resolved' ? 'Resolved' : 'Marked as False Positive'}
                </div>
              )}
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
        Showing {startItem}-{endItem} of {totalItems} alerts
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

const BulkActionsBar: React.FC<{
  selectedCount: number;
  totalCount: number;
  onAcknowledge: () => void;
  onResolve: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  selectionType: SelectionType;
}> = ({ 
  selectedCount, 
  totalCount, 
  onAcknowledge, 
  onResolve, 
  onSelectAll, 
  onClearSelection,
  selectionType 
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-700">
      <div className="flex items-center gap-6 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 rounded-lg p-2">
            <CheckSquareIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-sm">
              {selectedCount} {selectedCount === 1 ? 'alert' : 'alerts'} selected
              {selectionType === 'all' && ` (all ${totalCount} alerts)`}
              {selectionType === 'page' && ' (this page)'}
            </div>
            <div className="text-xs text-gray-300">
              {selectionType !== 'all' && (
                <button
                  onClick={onSelectAll}
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  Select all {totalCount} alerts
                </button>
              )}
              {selectionType !== 'none' && (
                <button
                  onClick={onClearSelection}
                  className="text-gray-300 hover:text-gray-200 underline ml-3"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-gray-600"></div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAcknowledge}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors font-medium text-sm"
          >
            <Check className="w-4 h-4" />
            Acknowledge ({selectedCount})
          </button>
          <button
            onClick={onResolve}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors font-medium text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Resolve ({selectedCount})
          </button>
        </div>
      </div>
    </div>
  );
};

export const AlertsPage: React.FC<AlertsPageProps> = ({ 
  pollIntervals,
  enabled = true,
  settings
}) => {
  const { alerts, getStats, refresh, loading } = useAlerts(enabled, pollIntervals?.alerts);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [selectionType, setSelectionType] = useState<SelectionType>('none');

  const ITEMS_PER_PAGE = 10;

  const stats = getStats();

  const filteredAlerts = useMemo(() => {
    let result = alerts;

    if (filterStatus !== 'all') {
      result = result.filter(a => a.status === filterStatus);
    }

    if (filterSeverity !== 'all') {
      result = result.filter(a => a.severity === filterSeverity);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        a => a.title.toLowerCase().includes(q) || (a.description?.toLowerCase().includes(q) || false)
      );
    }

    return result.sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  }, [alerts, filterStatus, filterSeverity, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE);
  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAlerts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAlerts, currentPage]);

  // Selection helpers
  const allSelectedOnPage = paginatedAlerts.length > 0 && 
    paginatedAlerts.every(alert => selectedAlerts.has(alert.id));
  
  const someSelectedOnPage = paginatedAlerts.some(alert => selectedAlerts.has(alert.id)) && 
    !allSelectedOnPage;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      setCurrentPage(1);
      setSelectedAlerts(new Set());
      setSelectionType('none');
    } catch (err) {
      console.error('Failed to refresh alerts:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcknowledge = async (alertIds: string | string[]) => {
    const ids = Array.isArray(alertIds) ? alertIds : [alertIds];
    try {
      await Promise.all(ids.map(id => alertService.acknowledgeAlert(id)));
      await refresh();
      if (Array.isArray(alertIds)) {
        setSelectedAlerts(new Set());
        setSelectionType('none');
      }
      setShowDetailModal(false);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleResolve = async (alertIds: string | string[]) => {
    const ids = Array.isArray(alertIds) ? alertIds : [alertIds];
    try {
      await Promise.all(ids.map(id => alertService.resolveAlert(id)));
      await refresh();
      if (Array.isArray(alertIds)) {
        setSelectedAlerts(new Set());
        setSelectionType('none');
      }
      setShowDetailModal(false);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const handleAlertClick = (alert: any) => {
    setSelectedAlert(alert);
    setShowDetailModal(true);
  };

  // Selection handlers
  const toggleAlertSelection = (alertId: string) => {
    const newSelected = new Set(selectedAlerts);
    if (newSelected.has(alertId)) {
      newSelected.delete(alertId);
    } else {
      newSelected.add(alertId);
    }
    setSelectedAlerts(newSelected);
    setSelectionType(newSelected.size === 0 ? 'none' : 'page');
  };

  const toggleSelectAllOnPage = () => {
    if (allSelectedOnPage) {
      // Deselect all on page
      const newSelected = new Set(selectedAlerts);
      paginatedAlerts.forEach(alert => newSelected.delete(alert.id));
      setSelectedAlerts(newSelected);
    } else {
      // Select all on page
      const newSelected = new Set(selectedAlerts);
      paginatedAlerts.forEach(alert => newSelected.add(alert.id));
      setSelectedAlerts(newSelected);
    }
    setSelectionType('page');
  };

  const selectAllAlerts = () => {
    const allAlertIds = new Set(filteredAlerts.map(alert => alert.id));
    setSelectedAlerts(allAlertIds);
    setSelectionType('all');
  };

  const clearSelection = () => {
    setSelectedAlerts(new Set());
    setSelectionType('none');
  };

  const getSelectedAlertIds = () => {
    return Array.from(selectedAlerts);
  };

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

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-red-50 text-red-700',
      acknowledged: 'bg-yellow-50 text-yellow-700',
      resolved: 'bg-green-50 text-green-700',
      false_positive: 'bg-gray-50 text-gray-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-50 text-gray-700';
  };

  const handleStatusChange = (value: string) => {
    setFilterStatus(value as FilterStatus);
    setCurrentPage(1);
    setSelectedAlerts(new Set());
    setSelectionType('none');
  };

  const handleSeverityChange = (value: string) => {
    setFilterSeverity(value);
    setCurrentPage(1);
    setSelectedAlerts(new Set());
    setSelectionType('none');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedAlerts(new Set());
    setSelectionType('none');
  };

  // Table view columns
  const tableColumns = [
    { key: 'selection', label: '', sortable: false },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'severity', label: 'Severity', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'client_id', label: 'Client ID', sortable: true },
    { key: 'detected_at', label: 'Detected', sortable: true }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <PageHeader
          title="Security Alerts"
          description="Monitor and respond to security incidents in real-time across your infrastructure"
          icon={<AlertTriangle className="w-6 h-6 text-red-300" />}
          gradient="bg-gradient-to-r from-slate-900 via-red-900 to-slate-900"
          action={
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
              <Bell className="w-4 h-4 text-red-300" />
              <span className="text-sm font-medium">
                {enabled ? 'Active Monitoring' : 'Monitoring Paused'}
              </span>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Alerts"
            value={stats.total}
            icon={<Bell className="w-4 h-4" />}
            color="blue"
          />
          <StatCard
            title="Open"
            value={stats.open}
            icon={<AlertTriangle className="w-4 h-4" />}
            color="red"
          />
          <StatCard
            title="Critical"
            value={stats.critical}
            icon={<XCircle className="w-4 h-4" />}
            color="orange"
          />
          <StatCard
            title="Resolved"
            value={stats.resolved}
            icon={<CheckCircle className="w-4 h-4" />}
            color="green"
          />
        </div>

        <DataGrid
          title="Security Incidents"
          description={`${filteredAlerts.length} alerts found`}
          action={
            <div className="flex items-center gap-3">
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
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh</span>
              </button>
            </div>
          }
          filters={
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search alerts by title or description..."
              filters={[
                {
                  value: filterStatus,
                  onChange: handleStatusChange,
                  options: [
                    { value: 'all', label: 'All Status' },
                    { value: 'open', label: 'Open' },
                    { value: 'acknowledged', label: 'Acknowledged' },
                    { value: 'resolved', label: 'Resolved' }
                  ],
                  label: 'Status'
                },
                {
                  value: filterSeverity,
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
                }
              ]}
            />
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No alerts found</p>
            </div>
          ) : viewType === 'table' ? (
            <>
              {/* Table View */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {tableColumns.map(column => (
                        <th 
                          key={column.key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {column.key === 'selection' ? (
                            <div className="flex items-center">
                              <button
                                onClick={toggleSelectAllOnPage}
                                className="flex items-center justify-center w-4 h-4 border border-gray-300 rounded hover:bg-gray-100"
                              >
                                {allSelectedOnPage ? (
                                  <CheckSquare className="w-3 h-3 text-blue-600" />
                                ) : someSelectedOnPage ? (
                                  <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                                ) : (
                                  <Square className="w-3 h-3 text-gray-400" />
                                )}
                              </button>
                            </div>
                          ) : (
                            column.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedAlerts.map(alert => (
                      <tr 
                        key={alert.id}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedAlerts.has(alert.id) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleAlertClick(alert)}
                      >
                        <td 
                          className="px-6 py-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => toggleAlertSelection(alert.id)}
                            className={`flex items-center justify-center w-4 h-4 border rounded hover:bg-gray-100 ${
                              selectedAlerts.has(alert.id)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                              {alert.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {alert.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(alert.status)}`}>
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {alert.client_id || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatters.getRelativeTime(alert.detected_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Table */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredAlerts.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </>
          ) : (
            <>
              {/* Card View */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {paginatedAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`bg-white border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer relative ${
                      selectedAlerts.has(alert.id) 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    {/* Selection Checkbox */}
                    <div 
                      className="absolute top-3 right-3 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => toggleAlertSelection(alert.id)}
                        className={`flex items-center justify-center w-5 h-5 border rounded hover:bg-gray-100 ${
                          selectedAlerts.has(alert.id)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {selectedAlerts.has(alert.id) && (
                          <Check className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-6">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 text-sm">{alert.title}</h3>
                          </div>
                          {alert.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-3">{alert.description}</p>
                          )}
                          
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`px-2 py-1 text-xs rounded font-medium ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(alert.status)}`}>
                              {alert.status}
                            </span>
                          </div>

                          <div className="text-xs text-gray-500 space-y-1">
                            {alert.client_id && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Client: {alert.client_id}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatters.getRelativeTime(alert.detected_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination for Cards */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredAlerts.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </>
          )}
        </DataGrid>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedAlerts.size}
        totalCount={filteredAlerts.length}
        onAcknowledge={() => handleAcknowledge(getSelectedAlertIds())}
        onResolve={() => handleResolve(getSelectedAlertIds())}
        onSelectAll={selectAllAlerts}
        onClearSelection={clearSelection}
        selectionType={selectionType}
      />

      {/* Alert Detail Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
      />
    </div>
  );
};