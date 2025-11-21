import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  bgGradient?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  bgGradient = 'from-blue-500 to-blue-600',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:border-gray-300' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p
              className={`text-xs mt-2 font-semibold ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : '-'}{trend.value}% from last week
            </p>
          )}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${bgGradient} rounded-lg flex items-center justify-center shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};
