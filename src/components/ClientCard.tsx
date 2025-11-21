import React from 'react';
import { Client } from '../types';
import { STATUS_COLORS, THREAT_LEVEL_COLORS } from '../utils/constants';
import { formatters } from '../utils/formatters';
import { Server, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react';

interface ClientCardProps {
  client: Client;
  onClick: () => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
  const statusColors = STATUS_COLORS[client.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.inactive;
  const threatColors =
    THREAT_LEVEL_COLORS[client.threat_level as keyof typeof THREAT_LEVEL_COLORS] ||
    THREAT_LEVEL_COLORS.none;

  const isActive = client.status === 'active';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusColors.dot}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {client.hostname}
            </h3>
            <p className="text-xs text-gray-500 truncate">{client.unique_id}</p>
          </div>
        </div>
        <div className={`flex-shrink-0 ${isActive ? 'text-green-500' : 'text-gray-400'}`}>
          {isActive ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">OS</span>
          <span className="text-gray-900 font-medium">
            {client.os_name} {client.os_version}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Status</span>
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${statusColors.bg} ${statusColors.text}`}
          >
            {client.status}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Threat Level</span>
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${threatColors.bg} ${threatColors.text}`}
          >
            {client.threat_level}
          </span>
        </div>

        <div className="pt-2 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>{formatters.getRelativeTime(client.last_seen)}</span>
        </div>
      </div>
    </div>
  );
};
