import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { STATUS_COLORS, THREAT_LEVEL_COLORS } from '../utils/constants';
import { formatters } from '../utils/formatters';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface ClientTableProps {
  clients: Client[];
  onClientClick: (client: Client) => void;
  loading?: boolean;
  itemsPerPage?: number;
}

type SortField = 'hostname' | 'os_name' | 'status' | 'threat_level' | 'last_seen';
type SortOrder = 'asc' | 'desc';

export const ClientTable: React.FC<ClientTableProps> = ({ 
  clients, 
  onClientClick, 
  loading = false,
  itemsPerPage = 20 
}) => {
  const [sortField, setSortField] = useState<SortField>('last_seen');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Sort clients
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (sortField === 'last_seen') {
        const aDate = new Date(aVal as string).getTime();
        const bDate = new Date(bVal as string).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [clients, sortField, sortOrder]);

  // Paginate clients
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedClients.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedClients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setCurrentPage(1);
    // Note: itemsPerPage is a prop, so we'd need to lift state up or use callback
    // For now, we'll just reset to page 1
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  // Pagination Component
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
      <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
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
                {Math.min(currentPage * itemsPerPage, sortedClients.length)}
              </span>{' '}
              of <span className="font-medium">{sortedClients.length}</span> clients
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Rows per page:</span>
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
                <ChevronLeft className="w-4 h-4" />
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
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <div className="text-center py-8 text-gray-500">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('hostname')}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Hostname
                <SortIcon field="hostname" />
              </button>
            </th>
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('os_name')}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                OS
                <SortIcon field="os_name" />
              </button>
            </th>
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('status')}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Status
                <SortIcon field="status" />
              </button>
            </th>
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('threat_level')}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Threat Level
                <SortIcon field="threat_level" />
              </button>
            </th>
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('last_seen')}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Last Seen
                <SortIcon field="last_seen" />
              </button>
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">IP Address</th>
          </tr>
        </thead>
        <tbody>
          {paginatedClients.map((client, index) => {
            const statusColors = STATUS_COLORS[client.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.inactive;
            const threatColors =
              THREAT_LEVEL_COLORS[client.threat_level as keyof typeof THREAT_LEVEL_COLORS] ||
              THREAT_LEVEL_COLORS.none;

            return (
              <tr
                key={client.id}
                onClick={() => onClientClick(client)}
                className={`border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors duration-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{client.hostname}</p>
                    <p className="text-xs text-gray-500">{client.unique_id}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-700">
                    {client.os_name} {client.os_version}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors.bg} ${statusColors.text}`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${threatColors.bg} ${threatColors.text}`}>
                    {client.threat_level}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-700">{formatters.getRelativeTime(client.last_seen)}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 font-mono">{client.ip_address || 'N/A'}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {sortedClients.length === 0 && (
        <div className="text-center py-8 text-gray-500">No clients found</div>
      )}
      
      {sortedClients.length > 0 && <Pagination />}
    </div>
  );
};