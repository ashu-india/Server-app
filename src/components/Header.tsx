import React from 'react';
import BackendHealth from './BackendHealth';
import { Bell, Settings, User, LogOut, AlertCircle } from 'lucide-react';

interface HeaderProps {
  unreadAlerts: number;
  onNotificationsClick: () => void;
  onSettingsClick: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  user?: { email?: string; full_name?: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  unreadAlerts,
  onNotificationsClick,
  onSettingsClick,
  onProfileClick,
  onLogout,
  user,
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ThreatShield</h1>
            <p className="text-xs text-gray-500">Intelligence Platform</p>
          </div>
              <div className="ml-4">
                {/* backend health indicator */}
                <div className="mt-1">
                  {/* lazy load to avoid server-side rendering issues */}
                  <React.Suspense fallback={<div className="text-xs text-gray-400">Checking...</div>}>
                    {/* @ts-ignore */}
                    <BackendHealth />
                  </React.Suspense>
                </div>
              </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={onNotificationsClick}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            )}
          </button>

          <button
            onClick={onSettingsClick}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <Settings className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-200" />

          <div className="relative">
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">{user?.full_name || user?.email || 'Admin'}</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                <button onClick={() => { setOpen(false); onProfileClick(); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">Profile</button>
                <button onClick={() => { setOpen(false); onSettingsClick(); }} className="w-full text-left px-4 py-2 hover:bg-gray-50">Settings</button>
                <div className="border-t my-1" />
                <button onClick={() => { setOpen(false); onLogout(); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50">Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
