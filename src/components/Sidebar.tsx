import React, { useState } from 'react';
import { BarChart3, Users, Shield, TrendingUp, AlertTriangle, Settings, ChevronDown, Menu, X , StampIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  subItems?: { id: string; label: string }[];
}

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  alertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick, alertCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['dashboard']);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'iocs',
      label: 'IOC Management',
      icon: <Shield className="w-5 h-5" />,
    },
    {
      id: 'threats',
      label: 'Threat Hunting',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <AlertTriangle className="w-5 h-5" />,
      badge: alertCount,
    },
     {
      id: 'policy',
      label: 'Policy',
      icon: <StampIcon className="w-5 h-5" />,
      
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const toggleExpand = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleItemClick = (id: string) => {
    onItemClick(id);
    setIsOpen(false);
  };

  return (
    <>
      <button
        className="fixed bottom-6 right-6 md:hidden z-40 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`fixed left-0 top-16 w-64 h-[calc(100vh-64px)] bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 z-40 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <nav className="p-4 space-y-2">
          {navItems.map(item => (
            <div key={item.id}>
              <button
                onClick={() => {
                  handleItemClick(item.id);
                  if (item.subItems) {
                    toggleExpand(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeItem === item.id
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-semibold">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  {item.subItems && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedItems.includes(item.id) ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </button>

              {item.subItems && expandedItems.includes(item.id) && (
                <div className="ml-4 mt-2 space-y-1 border-l border-gray-200">
                  {item.subItems.map(subItem => (
                    <button
                      key={subItem.id}
                      onClick={() => handleItemClick(subItem.id)}
                      className={`w-full text-left px-4 py-2 text-sm rounded transition-colors duration-200 ${
                        activeItem === subItem.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
