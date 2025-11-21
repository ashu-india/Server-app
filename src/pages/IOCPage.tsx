import React, { useState, useMemo } from 'react';
import { useIOCs } from '../hooks/useIOCs';
import { iocService } from '../services/iocService';
import { formatters } from '../utils/formatters';
import { IOC_TYPE_LABELS } from '../utils/constants';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/layout/StatCard';
import { DataGrid } from '../components/layout/DataGrid';
import { SearchFilters } from '../components/layout/SearchFilters';
import { 
  Shield, 
  AlertTriangle, 
  Target, 
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  X,
  BarChart3,
  Calendar,
  User,
  Hash,
  Globe,
  FileText,
  Cpu,
  Code,
  Database,
  Network,
  Server,
  Table,
  Grid,
  ChevronLeft,
  ChevronRight,
  Clock,
  Activity,
  Tag,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';

interface IOCPageProps {
  pollIntervals?: {
    alerts: number;
    clients: number;
    iocs: number;
  };
}

type IOCType = keyof typeof IOC_TYPE_LABELS;
type ViewType = 'table' | 'cards';

interface NewIOCFormData {
  indicator_value: string;
  indicator_type: IOCType;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source: string;
  description?: string;
  confidence_score: number;
  tags?: string[];
}

interface IOCIndicator {
  id: string;
  indicator_value: string;
  indicator_type: IOCType;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source: string;
  description?: string;
  confidence_score: number;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  last_seen?: string;
  first_seen?: string;
  is_active?: boolean;
  expires_at?: string;
}

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
        Showing {startItem}-{endItem} of {totalItems} IOCs
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

export const IOCPage: React.FC<IOCPageProps> = ({ pollIntervals }) => {
  const { iocs, getStats, refresh, loading } = useIOCs(pollIntervals?.iocs);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewingIOC, setViewingIOC] = useState<IOCIndicator | null>(null);
  const [viewType, setViewType] = useState<ViewType>('table');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 12;

  const stats = getStats();

  const filteredIOCs = useMemo(() => {
    let result = iocs;

    if (filterType !== 'all') {
      result = result.filter(i => i.indicator_type === filterType);
    }

    if (filterSeverity !== 'all') {
      result = result.filter(i => i.severity === filterSeverity);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        i =>
          i.indicator_value.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.source.toLowerCase().includes(q)
      );
    }

    return result;
  }, [iocs, filterType, filterSeverity, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredIOCs.length / ITEMS_PER_PAGE);
  const paginatedIOCs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredIOCs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredIOCs, currentPage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to refresh IOCs:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this IOC?')) {
      try {
        await iocService.deleteIOC(id);
        await refresh();
      } catch (err) {
        console.error('Failed to delete IOC:', err);
        alert('Failed to delete IOC. Please try again.');
      }
    }
  };

  const handleAddIOC = async (formData: NewIOCFormData) => {
    setSubmitting(true);
    try {
      await iocService.createIOC(formData as Partial<any>);
      setShowNewForm(false);
      await refresh();
    } catch (err) {
      console.error('Failed to add IOC:', err);
      alert('Failed to add IOC. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500',
      info: 'bg-gray-500'
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

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      ip: <Globe className="w-4 h-4" />,
      domain: <Globe className="w-4 h-4" />,
      url: <Hash className="w-4 h-4" />,
      hash: <FileText className="w-4 h-4" />,
      email: <User className="w-4 h-4" />,
      file: <FileText className="w-4 h-4" />,
      process: <Cpu className="w-4 h-4" />,
      registry: <Database className="w-4 h-4" />,
      command: <Code className="w-4 h-4" />,
      network: <Network className="w-4 h-4" />,
    };
    return icons[type] || <Server className="w-4 h-4" />;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleSeverityChange = (value: string) => {
    setFilterSeverity(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <PageHeader
          title="Threat Intelligence"
          description="Manage and monitor Indicators of Compromise from threat intelligence feeds"
          icon={<Shield className="w-6 h-6 text-purple-300" />}
          gradient="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900"
          action={
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Active Monitoring</span>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            title="Total IOCs"
            value={stats.total}
            icon={<Shield className="w-4 h-4" />}
            color="blue"
          />
          <StatCard
            title="Critical"
            value={stats.bySeverity?.critical || 0}
            icon={<AlertTriangle className="w-4 h-4" />}
            color="red"
          />
          <StatCard
            title="High Confidence"
            value={stats.highConfidence}
            icon={<BarChart3 className="w-4 h-4" />}
            color="emerald"
          />
          <StatCard
            title="Sources"
            value={Object.keys(stats.bySource || {}).length}
            icon={<Target className="w-4 h-4" />}
            color="purple"
          />
        </div>

        <DataGrid
          title="Indicators of Compromise"
          description={`${filteredIOCs.length} indicators monitored`}
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
                onClick={() => setShowNewForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-semibold">Add IOC</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
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
              searchPlaceholder="Search IOC value, source, or description..."
              filters={[
                {
                  value: filterType,
                  onChange: handleStatusChange,
                  options: [
                    { value: 'all', label: 'All Types' },
                    ...Object.entries(IOC_TYPE_LABELS).map(([key, label]) => ({
                      value: key,
                      label
                    }))
                  ],
                  label: 'Type'
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
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Loading IOCs...</p>
              </div>
            </div>
          ) : filteredIOCs.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg mb-2">No IOCs found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters or add a new IOC</p>
            </div>
          ) : viewType === 'table' ? (
            <>
              {/* Table View */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Indicator</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Type</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Source</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Severity</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Confidence</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Added</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedIOCs.map((ioc, index) => {
                      const typeLabel = IOC_TYPE_LABELS[ioc.indicator_type as keyof typeof IOC_TYPE_LABELS] || ioc.indicator_type;
                      
                      return (
                        <tr 
                          key={ioc.id} 
                          className="border-b border-gray-100 hover:bg-blue-50/30 transition-all duration-200 group cursor-pointer"
                          onClick={() => setViewingIOC(ioc)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getTypeIcon(ioc.indicator_type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-mono font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                                  {formatters.truncateText(ioc.indicator_value, 40)}
                                </p>
                                {ioc.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                    {formatters.truncateText(ioc.description, 60)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold border border-blue-200">
                              {getTypeIcon(ioc.indicator_type)}
                              {typeLabel}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <User className="w-4 h-4 text-gray-400" />
                              {ioc.source}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getSeverityColor(ioc.severity)} shadow-sm`} />
                              <span className={`text-sm font-semibold capitalize px-2 py-1 rounded-full ${
                                ioc.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                ioc.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                ioc.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                ioc.severity === 'low' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {ioc.severity}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-xs overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${
                                    ioc.confidence_score >= 80 ? 'from-green-500 to-emerald-500' :
                                    ioc.confidence_score >= 60 ? 'from-yellow-500 to-amber-500' :
                                    'from-red-500 to-orange-500'
                                  }`}
                                  style={{ width: `${ioc.confidence_score}%` }}
                                />
                              </div>
                              <span className={`text-sm font-bold min-w-8 ${
                                ioc.confidence_score >= 80 ? 'text-emerald-700' :
                                ioc.confidence_score >= 60 ? 'text-amber-700' :
                                'text-red-700'
                              }`}>
                                {ioc.confidence_score}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {formatters.getRelativeTime(ioc.created_at)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingIOC(ioc);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                                title="View IOC Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(ioc.id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                                title="Delete IOC"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
                totalItems={filteredIOCs.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </>
          ) : (
            <>
              {/* Card View */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {paginatedIOCs.map((ioc) => {
                  const typeLabel = IOC_TYPE_LABELS[ioc.indicator_type as keyof typeof IOC_TYPE_LABELS] || ioc.indicator_type;
                  
                  return (
                    <div
                      key={ioc.id}
                      className="bg-white rounded-2xl border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer group overflow-hidden"
                      onClick={() => setViewingIOC(ioc)}
                    >
                      {/* Header with severity gradient */}
                      <div className={`bg-gradient-to-r ${getSeverityGradient(ioc.severity)} p-4`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                              {getTypeIcon(ioc.indicator_type)}
                            </div>
                            <span className="text-white font-semibold text-sm capitalize">
                              {ioc.severity}
                            </span>
                          </div>
                          <div className="text-white/80 text-xs font-medium">
                            {typeLabel}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-4">
                        {/* Indicator Value */}
                        <div>
                          <p className="font-mono text-sm text-gray-900 font-semibold break-all line-clamp-2 group-hover:text-blue-900 transition-colors">
                            {ioc.indicator_value}
                          </p>
                          {ioc.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {ioc.description}
                            </p>
                          )}
                        </div>

                        {/* Source and Confidence */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Source</span>
                            <span className="font-medium text-gray-700">{ioc.source}</span>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">Confidence</span>
                              <span className={`font-bold ${
                                ioc.confidence_score >= 80 ? 'text-emerald-700' :
                                ioc.confidence_score >= 60 ? 'text-amber-700' :
                                'text-red-700'
                              }`}>
                                {ioc.confidence_score}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${
                                  ioc.confidence_score >= 80 ? 'from-green-500 to-emerald-500' :
                                  ioc.confidence_score >= 60 ? 'from-yellow-500 to-amber-500' :
                                  'from-red-500 to-orange-500'
                                }`}
                                style={{ width: `${ioc.confidence_score}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        {ioc.tags && ioc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {ioc.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200"
                              >
                                {tag}
                              </span>
                            ))}
                            {ioc.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{ioc.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatters.getRelativeTime(ioc.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingIOC(ioc);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200"
                              title="View Details"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(ioc.id);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200"
                              title="Delete IOC"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
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
                totalItems={filteredIOCs.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </>
          )}
        </DataGrid>

        {showNewForm && (
          <NewIOCForm
            onClose={() => setShowNewForm(false)}
            onSubmit={handleAddIOC}
            submitting={submitting}
          />
        )}

        {viewingIOC && (
          <ViewIOCModal
            ioc={viewingIOC}
            onClose={() => setViewingIOC(null)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

// Enhanced New IOC Form Component (same as before)
interface NewIOCFormProps {
  onClose: () => void;
  onSubmit: (data: NewIOCFormData) => void;
  submitting: boolean;
}

const NewIOCForm: React.FC<NewIOCFormProps> = ({ onClose, onSubmit, submitting }) => {
  const [formData, setFormData] = useState<NewIOCFormData>({
    indicator_value: '',
    indicator_type: 'ip',
    severity: 'medium',
    source: 'manual',
    description: '',
    confidence_score: 80,
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.indicator_value.trim()) {
      alert('Indicator value is required');
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (field: keyof NewIOCFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const iocTypes = Object.keys(IOC_TYPE_LABELS) as IOCType[];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl transform animate-in slide-in-from-bottom-10 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add New Indicator of Compromise</h2>
                <p className="text-blue-100 text-sm mt-1">Create a new threat indicator for monitoring</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50 group"
            >
              <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Indicator Value */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Indicator Value *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.indicator_value}
                onChange={(e) => handleChange('indicator_value', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition-all duration-200"
                placeholder="e.g., 192.168.1.1, malicious-domain.com, file-hash..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Hash className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Type and Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Indicator Type
              </label>
              <div className="relative">
                <select
                  value={formData.indicator_type}
                  onChange={(e) => handleChange('indicator_type', e.target.value as IOCType)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 appearance-none transition-all duration-200"
                >
                  {iocTypes.map((type) => (
                    <option key={type} value={type}>
                      {IOC_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Globe className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Severity Level
              </label>
              <select
                value={formData.severity}
                onChange={(e) => handleChange('severity', e.target.value as NewIOCFormData['severity'])}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition-all duration-200"
              >
                <option value="critical"> Critical</option>
                <option value="high"> High</option>
                <option value="medium"> Medium</option>
                <option value="low"> Low</option>
                <option value="info"> Info</option>
              </select>
            </div>
          </div>

          {/* Source and Confidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Source
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition-all duration-200"
                  placeholder="e.g., Threat Intelligence Feed"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Confidence Score: {formData.confidence_score}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.confidence_score}
                onChange={(e) => handleChange('confidence_score', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition-all duration-200"
                placeholder="Add tags..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200"
              >
                Add
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition-all duration-200 resize-none"
              placeholder="Provide context about this IOC, such as attack patterns, associated threats, or mitigation recommendations..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create IOC
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced View IOC Modal Component
interface ViewIOCModalProps {
  ioc: IOCIndicator;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const ViewIOCModal: React.FC<ViewIOCModalProps> = ({ ioc, onClose, onDelete }) => {
  const [copied, setCopied] = useState(false);

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

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      ip: <Globe className="w-6 h-6" />,
      domain: <Globe className="w-6 h-6" />,
      url: <Hash className="w-6 h-6" />,
      hash: <FileText className="w-6 h-6" />,
      email: <User className="w-6 h-6" />,
      file: <FileText className="w-6 h-6" />,
      process: <Cpu className="w-6 h-6" />,
      registry: <Database className="w-6 h-6" />,
      command: <Code className="w-6 h-6" />,
      network: <Network className="w-6 h-6" />,
    };
    return icons[type] || <Server className="w-6 h-6" />;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeLabel = IOC_TYPE_LABELS[ioc.indicator_type as keyof typeof IOC_TYPE_LABELS] || ioc.indicator_type;

  const getThreatLevelInfo = (severity: string) => {
    const info = {
      critical: {
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        description: 'Immediate threat requiring urgent attention'
      },
      high: {
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        description: 'Significant threat requiring prompt action'
      },
      medium: {
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        description: 'Moderate threat requiring monitoring'
      },
      low: {
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        description: 'Low-level threat for awareness'
      },
      info: {
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        description: 'Informational indicator'
      }
    };
    return info[severity as keyof typeof info] || info.info;
  };

  const threatInfo = getThreatLevelInfo(ioc.severity);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl transform animate-in slide-in-from-bottom-10 duration-300">
        {/* Header */}
        <div className={`relative bg-gradient-to-r ${getSeverityGradient(ioc.severity)} p-8`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                {getTypeIcon(ioc.indicator_type)}
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2">Indicator of Compromise</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                    {typeLabel}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm capitalize">
                    {ioc.severity} Severity
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                    {ioc.confidence_score}% Confidence
                  </span>
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
            {/* Left Column - Basic Info */}
            <div className="xl:col-span-2 space-y-6">
              {/* Indicator Value */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-blue-600" />
                    Indicator Value
                  </h3>
                  <button
                    onClick={() => copyToClipboard(ioc.indicator_value)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <code className="font-mono text-sm text-gray-900 break-all">
                    {ioc.indicator_value}
                  </code>
                </div>
              </div>

              {/* Threat Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Threat Level
                  </h3>
                  <div className={`p-4 rounded-xl border-2 ${threatInfo.border} ${threatInfo.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-lg font-bold capitalize ${threatInfo.color}`}>
                        {ioc.severity}
                      </span>
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getSeverityGradient(ioc.severity)}`} />
                    </div>
                    <p className="text-sm text-gray-600">
                      {threatInfo.description}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    Confidence Score
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Accuracy</span>
                      <span className={`text-xl font-bold ${
                        ioc.confidence_score >= 80 ? 'text-emerald-700' :
                        ioc.confidence_score >= 60 ? 'text-amber-700' :
                        'text-red-700'
                      }`}>
                        {ioc.confidence_score}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          ioc.confidence_score >= 80 ? 'from-green-500 to-emerald-500' :
                          ioc.confidence_score >= 60 ? 'from-yellow-500 to-amber-500' :
                          'from-red-500 to-orange-500'
                        }`}
                        style={{ width: `${ioc.confidence_score}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {ioc.description && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Context & Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {ioc.description}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-6">
              {/* Source Information */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Source Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Source</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{ioc.source}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${ioc.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm font-medium text-gray-900">
                        {ioc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

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
                      <span className="text-sm font-medium text-gray-600">Created</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatters.formatDate(ioc.created_at)}</p>
                      <p className="text-xs text-gray-500">{formatters.getRelativeTime(ioc.created_at)}</p>
                    </div>
                  </div>
                  
                  {ioc.updated_at && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Updated</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatters.formatDate(ioc.updated_at)}</p>
                        <p className="text-xs text-gray-500">{formatters.getRelativeTime(ioc.updated_at)}</p>
                      </div>
                    </div>
                  )}

                  {ioc.first_seen && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">First Seen</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{formatters.formatDate(ioc.first_seen)}</p>
                    </div>
                  )}

                  {ioc.last_seen && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Last Seen</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{formatters.formatDate(ioc.last_seen)}</p>
                    </div>
                  )}

                  {ioc.expires_at && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Expires</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{formatters.formatDate(ioc.expires_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {ioc.tags && ioc.tags.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-indigo-600" />
                    Associated Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ioc.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-sm rounded-xl border border-indigo-200 font-medium shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => copyToClipboard(ioc.indicator_value)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Indicator'}
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm">
                <ExternalLink className="w-4 h-4" />
                Search Intelligence
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this IOC?')) {
                    onDelete(ioc.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl hover:bg-red-100 transition-all duration-200 font-medium shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete IOC
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};