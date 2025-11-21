import React from 'react';
import useBackendHealth from '../hooks/useBackendHealth';

export const BackendHealth: React.FC = () => {
  const { status, lastChecked } = useBackendHealth(5000);
  const color = status === 'online' ? 'bg-green-500' : status === 'offline' ? 'bg-red-500' : 'bg-gray-300';
  const label = status === 'online' ? 'Backend OK' : status === 'offline' ? 'Backend Offline' : 'Checking...';
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className={`w-3 h-3 rounded-full ${color}`} aria-hidden />
      <span>{label}</span>
    </div>
  );
};

export default BackendHealth;
