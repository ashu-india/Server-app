import React, { useState, useMemo } from 'react';
import { useClients } from '../hooks/useClients';
import { ClientTable } from '../components/ClientTable';
import { ClientCard } from '../components/ClientCard';
import { ClientDetailModal } from '../components/ClientDetailModal';
import { Client } from '../types';
import { 
  AlertTriangle, 
  Activity, 
  LayoutGrid, 
  LayoutList, 
  Search,
  RefreshCw,
  Cpu,
  Network,
  Server,

  Clock,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';

type ViewType = 'table' | 'cards';

interface ClientsPageProps {
  pollIntervals?: {
    alerts: number;
    clients: number;
    iocs: number;
  };
  autoRefresh?: boolean;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({ pollIntervals, autoRefresh }) => {
  const { clients, loading, getStats, search: searchClients, refresh } = useClients(pollIntervals?.clients);
  const [viewType, setViewType] = useState<ViewType>('table');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterThreatLevel, setFilterThreatLevel] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const stats = getStats();

  const filteredClients = useMemo(() => {
    let result = searchQuery ? searchClients(searchQuery) : clients;

    if (filterStatus !== 'all') {
      result = result.filter(c => c.status === filterStatus);
    }

    if (filterThreatLevel !== 'all') {
      result = result.filter(c => c.threat_level === filterThreatLevel);
    }

    return result;
  }, [clients, searchQuery, filterStatus, filterThreatLevel, searchClients]);

  // Pagination calculations for card view
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      setLastUpdated(new Date());
      setCurrentPage(1); // Reset to first page on refresh
    } catch (err) {
      console.error('Failed to refresh clients:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // Enhanced stats with more data points
  const enhancedStats = useMemo(() => {
    const totalClients = stats.total;
    const activeClients = stats.active;
    const highThreat = stats.highThreat;
    const mediumThreat = stats.mediumThreat;
    const criticalThreat = clients.filter(c => c.threat_level === 'critical').length;
    const disconnected = stats.disconnected;
    
    return {
      totalClients,
      activeClients,
      highThreat,
      mediumThreat,
      criticalThreat,
      disconnected,
      healthScore: totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0
    };
  }, [stats, clients]);

  const StatCard = ({ 
    title, 
    value, 
    subtitle,
    icon: Icon,
    trend,
    color = 'blue'
  }: { 
    title: string; 
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: { value: number; direction: 'up' | 'down' };
    color?: 'blue' | 'green' | 'red' | 'orange' | 'purple';
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      red: 'from-red-500 to-red-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600'
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-300 group">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color]} shadow-sm`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
              trend.direction === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          {subtitle && (
            <div className="text-xs text-gray-500">{subtitle}</div>
          )}
        </div>
      </div>
    );
  };

  // Pagination Component for Card View
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between items-center sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredClients.length)}
              </span>{' '}
              of <span className="font-medium">{filteredClients.length}</span> results
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="rounded-md border border-gray-300 bg-white py-1 pl-2 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                &larr;
              </button>
              
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 ${
                    currentPage === page
                      ? 'bg-blue-600 text-white focus:visible:outline-2 focus:visible:outline-offset-2 focus:visible:outline-blue-600'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                &rarr;
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Footer Component for both views
  const Footer = () => (
    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Active: {enhancedStats.activeClients}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Critical: {enhancedStats.criticalThreat}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Offline: {enhancedStats.disconnected}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Total: {clients.length} systems</span>
          <span>Filtered: {filteredClients.length} systems</span>
          {viewType === 'cards' && (
            <span>Page {currentPage} of {totalPages}</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header with Monitoring Status */}
        <PageHeader
          title="Endpoint Management"
          description="Monitor and manage all connected systems and endpoints"
          icon={<AlertTriangle className="w-6 h-6 text-red-300" />}
          gradient="bg-gradient-to-r from-slate-900 via-red-900 to-slate-900"
          action={
            <div className="flex items-center gap-4">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm border ${
                autoRefresh 
                  ? 'bg-green-500/20 text-green-300 border-green-400/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  autoRefresh ? 'bg-green-400' : 'bg-amber-400'
                }`}></div>
                <span className="text-sm font-medium">
                  {autoRefresh ? `Live Monitoring (${pollIntervals?.clients ? pollIntervals.clients / 1000 + 's' : '30s'})` : 'Monitoring Paused'}
                </span>
              </div>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          }
        />

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Systems"
            value={enhancedStats.totalClients}
            icon={Server}
            color="blue"
          />
          <StatCard
            title="Active"
            value={enhancedStats.activeClients}
            subtitle={`${enhancedStats.healthScore}% healthy`}
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Critical"
            value={enhancedStats.criticalThreat}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="Offline"
            value={enhancedStats.disconnected}
            icon={Network}
            color="purple"
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search endpoints, hostnames, IPs..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page when searching
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={e => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-32"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="disconnected">Disconnected</option>
                    <option value="error">Error</option>
                  </select>

                  <select
                    value={filterThreatLevel}
                    onChange={e => {
                      setFilterThreatLevel(e.target.value);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-36"
                  >
                    <option value="all">All Threats</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setViewType('table');
                      setCurrentPage(1); // Reset to first page when changing view
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                      viewType === 'table'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutList className="w-4 h-4" />
                    Table
                  </button>
                  <button
                    onClick={() => {
                      setViewType('cards');
                      setCurrentPage(1); // Reset to first page when changing view
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                      viewType === 'cards'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Cards
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">Loading endpoint data...</p>
                </div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Cpu className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No endpoints found</p>
                <p className="text-gray-500 text-sm mt-1">
                  {searchQuery || filterStatus !== 'all' || filterThreatLevel !== 'all' 
                    ? 'Try adjusting your search criteria'
                    : 'No systems are currently monitored'
                  }
                </p>
              </div>
            ) : viewType === 'table' ? (
              // Table view with ClientTable handling its own pagination
              <ClientTable
                clients={filteredClients} // Pass all filtered clients
                onClientClick={setSelectedClient}
                loading={loading}
                itemsPerPage={itemsPerPage}
              />
            ) : (
              // Card view with manual pagination
              <>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedClients.map(client => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        onClick={() => setSelectedClient(client)}
                      />
                    ))}
                  </div>
                </div>
                <Pagination />
              </>
            )}
          </div>

          {/* Footer for both views */}
          <Footer />
        </div>
      </div>

      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
};