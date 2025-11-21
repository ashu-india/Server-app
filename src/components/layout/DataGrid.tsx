import React from 'react';

interface DataGridProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const DataGrid: React.FC<DataGridProps> = ({
  title,
  description,
  action,
  filters,
  children,
  footer
}) => (
  <div className="bg-white rounded-xl border border-gray-200">
    {/* Header */}
    <div className="p-4 border-b border-gray-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {description && <p className="text-gray-600 text-sm mt-1">{description}</p>}
        </div>
        {action}
      </div>
    </div>

    {/* Filters */}
    {filters && (
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        {filters}
      </div>
    )}

    {/* Content */}
    <div className="p-4">
      {children}
    </div>

    {/* Footer */}
    {footer && (
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {footer}
      </div>
    )}
  </div>
);