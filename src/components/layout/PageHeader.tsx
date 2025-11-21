import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  gradient,
  action
}) => (
  <div className={`relative overflow-hidden rounded-2xl ${gradient} p-8 text-white shadow-2xl`}>
    <div className="relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              {icon}
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
          <p className="text-blue-200 text-lg max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>
        {action && (
          <div className="text-right">
            {action}
          </div>
        )}
      </div>
    </div>
    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
  </div>
);