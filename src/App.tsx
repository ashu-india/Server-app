import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { IOCPage } from './pages/IOCPage';
import { AlertsPage } from './pages/AlertsPage';
import { ThreatsPage } from './pages/ThreatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAlerts } from './hooks/useAlerts';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { getToken } from './services/api';
import { logout } from './services/authService';
import api from './services/api';
import { ProfilePage } from './pages/ProfilePage';
import PolicyManager from './pages/PolicyManager';

type PageType = 'dashboard' | 'clients' | 'iocs' | 'threats' | 'alerts' | 'settings' | 'profile' | 'policy';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const initialShowLanding = typeof window !== 'undefined' && localStorage.getItem('showLanding') === 'false' ? false : true;
  const [showLanding, setShowLanding] = useState<boolean>(initialShowLanding);

  const [alertsPollInterval, setAlertsPollInterval] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('pollInterval_alerts') || '10000', 10); } catch { return 10000; }
  });
  const [clientsPollInterval, setClientsPollInterval] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('pollInterval_clients') || '30000', 10); } catch { return 30000; }
  });
  const [iocsPollInterval, setIOCsPollInterval] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('pollInterval_iocs') || '60000', 10); } catch { return 60000; }
  });
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('autoRefresh') || 'true'); } catch (e) { console.debug('failed to read autoRefresh', e); return true; }
  });
  const { alerts } = useAlerts(isAuthenticated && autoRefresh, alertsPollInterval);

  useEffect(() => {
    setIsAuthenticated(!!getToken());
  }, []);

  // Fetch profile when authenticated
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/api/profile');
        if (res && res.user) {
          setUser(res.user);
          // If user has saved settings, apply them
          const s = res.user.settings || {};
          setSettings(s);
          if (s.pollInterval_alerts) setAlertsPollInterval(Number(s.pollInterval_alerts));
          if (s.pollInterval_clients) setClientsPollInterval(Number(s.pollInterval_clients));
          if (s.pollInterval_iocs) setIOCsPollInterval(Number(s.pollInterval_iocs));
          if (typeof s.autoRefresh !== 'undefined') {
            setAutoRefresh(Boolean(s.autoRefresh));
            try { localStorage.setItem('autoRefresh', JSON.stringify(Boolean(s.autoRefresh))); } catch (e) { console.debug('failed to persist autoRefresh', e); }
          }
          if (s.darkMode) {
            try { document.documentElement.classList.add('dark'); } catch (e) { console.debug('dark mode apply failed', e); }
          } else {
            try { document.documentElement.classList.remove('dark'); } catch (e) { console.debug('dark mode remove failed', e); }
          }
        }
      } catch (err) {
        console.debug('failed to load profile', err);
      }
    }
    if (isAuthenticated) loadProfile();
    else setUser(null);
  }, [isAuthenticated]);

  useEffect(() => {
    // Expose polling interval controls to window for frontend manipulation

    ((window as unknown) as Record<string, unknown>).setPollInterval = (type: 'alerts' | 'clients' | 'iocs', interval: number) => {
      console.debug(`setPollInterval: ${type} = ${interval}ms`);
      if (type === 'alerts') setAlertsPollInterval(interval);
      else if (type === 'clients') setClientsPollInterval(interval);
      else if (type === 'iocs') setIOCsPollInterval(interval);
    };
    ((window as unknown) as Record<string, unknown>).getPollIntervals = () => ({
      alerts: alertsPollInterval,
      clients: clientsPollInterval,
      iocs: iocsPollInterval,
    });
  }, [alertsPollInterval, clientsPollInterval, iocsPollInterval]);

  useEffect(() => {
    // Log mounts for debugging unexpected reloads
    console.debug('App mounted; isAuthenticated=', !!getToken(), 'showLanding=', showLanding);
    // also listen for storage changes (token changes from other tabs)
    function onStorage(e: StorageEvent) {
      if (e.key === 'token') {
        console.info('token changed in storage event', e.oldValue ? 'was set' : 'was cleared');
        setIsAuthenticated(!!localStorage.getItem('token'));
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [showLanding]);

  const unreadAlerts = alerts.filter(a => a.status === 'open').length;

  const updatePollInterval = (type: 'alerts' | 'clients' | 'iocs', intervalMs: number) => {
    console.debug(`updatePollInterval: ${type} = ${intervalMs}ms`);
    try { localStorage.setItem(`pollInterval_${type}`, String(intervalMs)); } catch (e) { console.debug('failed to save pollInterval to localStorage', e); }
    if (type === 'alerts') setAlertsPollInterval(intervalMs);
    else if (type === 'clients') setClientsPollInterval(intervalMs);
    else if (type === 'iocs') setIOCsPollInterval(intervalMs);
    // Persist to backend if logged in
    (async () => {
      try {
        await api.put('/api/profile', { settings: { [`pollInterval_${type}`]: intervalMs } });
      } catch (err) {
        console.debug('failed to persist poll interval', err);
      }
    })();
  };

  const saveUserSettings = async (newSettings: Record<string, unknown>) => {
    // merge locally and persist
    const merged = { ...(settings || {}), ...newSettings };
    setSettings(merged);
    try { localStorage.setItem('threatshield_settings', JSON.stringify(merged)); } catch (e) { console.debug('failed to persist threatshield_settings', e); }
    // apply dark mode immediately
    if (merged.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    // persist to server
    try {
      const res = await api.put('/api/profile', { settings: newSettings });
      if (res && res.user) setUser(res.user);
    } catch (err) {
      console.debug('failed to persist user settings', err);
    }
    // update autoRefresh local state
    if (typeof newSettings.autoRefresh !== 'undefined') {
      setAutoRefresh(Boolean(newSettings.autoRefresh));
      try { localStorage.setItem('autoRefresh', JSON.stringify(Boolean(newSettings.autoRefresh))); } catch (e) { console.debug('failed to persist autoRefresh', e); }
    }
    // if retentionDays present, ask server to cleanup (server also called by SettingsPage)
    if (typeof newSettings.retentionDays !== 'undefined') {
      try { await api.post('/api/alerts/cleanup', { days: newSettings.retentionDays }); } catch (err) { console.debug('cleanup request failed', err); }
    }
  };

  const getPollIntervals = () => ({
    alerts: alertsPollInterval,
    clients: clientsPollInterval,
    iocs: iocsPollInterval,
  });

  // In App.tsx - Update the renderPage function for dashboard
const renderPage = () => {
  switch (currentPage) {
    case 'dashboard':
      return (
        <DashboardPage 
          pollIntervals={getPollIntervals()} 
          onNavigate={(page: string) => setCurrentPage(page as PageType)}
        />
      );
    case 'clients':
      return <ClientsPage pollIntervals={getPollIntervals()} autoRefresh />;
    case 'iocs':
      return <IOCPage pollIntervals={getPollIntervals()} />;
    case 'threats':
      return <ThreatsPage pollIntervals={getPollIntervals()} />;
    case 'alerts':
      return <AlertsPage pollIntervals={getPollIntervals()} enabled={isAuthenticated && autoRefresh} settings={settings || undefined} />;
    case 'settings':
      return <SettingsPage 
        pollIntervals={getPollIntervals()}
        onUpdatePollInterval={updatePollInterval}
        onSaveSettings={saveUserSettings}
      />;
      case 'policy':
      return <PolicyManager  />;
    case 'profile':
      return <ProfilePage user={user} onSave={(u) => setUser(u)} />;
    default:
      return <DashboardPage onNavigate={(page: string) => setCurrentPage(page as PageType)} />;
  }
};

  const handleLogout = () => {
    logout();
    localStorage.removeItem('autoRefresh');
    localStorage.removeItem('showLanding');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    if (showLanding) {
      return <HomePage onEnter={() => {
        setShowLanding(false);
        try { localStorage.setItem('showLanding', 'false'); } catch (err) { console.warn('failed to persist showLanding', err); }
      }} />;
    }
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        unreadAlerts={unreadAlerts}
        onNotificationsClick={() => setCurrentPage('alerts')}
        onSettingsClick={() => setCurrentPage('settings')}
        onProfileClick={() => setCurrentPage('profile')}
        onLogout={handleLogout}
        user={user}
      />
      <Sidebar
        activeItem={currentPage}
        onItemClick={(id) => setCurrentPage(id as PageType)}
        alertCount={unreadAlerts}
      />

      <main className="md:ml-64 pt-20 pb-8 px-4 md:px-8">
        <div className="max-w-full">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
