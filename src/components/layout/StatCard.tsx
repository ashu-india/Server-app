import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; direction: 'up' | 'down' };
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'emerald';
}

const colorClasses = {
  blue: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600' },
  green: { bg: 'from-green-500 to-green-600', text: 'text-green-600' },
  red: { bg: 'from-red-500 to-red-600', text: 'text-red-600' },
  orange: { bg: 'from-orange-500 to-orange-600', text: 'text-orange-600' },
  purple: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600' },
  emerald: { bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600' }
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue'
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-300 group">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color].bg} shadow-sm`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4 text-white' })}
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