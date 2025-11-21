import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, User } from 'lucide-react';

interface ProfilePageProps {
  user?: Record<string, any> | null;
  onSave?: (user: Record<string, any>) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user: initialUser, onSave }) => {
  const [user, setUser] = useState<Record<string, any> | null>(initialUser || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialUser) {
      (async () => {
        setLoading(true);
        try {
          const res = await api.get('/api/profile');
          if (res && res.user) setUser(res.user);
        } catch (err) {
          console.debug('failed to load profile', err);
        } finally { setLoading(false); }
      })();
    }
  }, [initialUser]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: any = { full_name: user.full_name };
      // persist settings object if present
      if (user.settings) payload.settings = user.settings;
      const res = await api.put('/api/profile', payload);
      if (res && res.user) {
        setUser(res.user);
        if (onSave) onSave(res.user);
      }
    } catch (err) {
      console.debug('failed to save profile', err);
    } finally { setSaving(false); }
  };

  if (loading) return <div>Loading profile...</div>;
  if (!user) return <div>No profile available</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Your account information and preferences</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
          <input className="w-full px-4 py-2 border rounded" value={user.full_name || ''} onChange={e => setUser({ ...user, full_name: e.target.value })} />
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2">Polling intervals (ms)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-600">Alerts</label>
              <input type="number" className="w-full px-3 py-2 border rounded" value={user.settings?.pollInterval_alerts || 10000} onChange={e => setUser({ ...user, settings: { ...(user.settings || {}), pollInterval_alerts: Number(e.target.value) } })} />
            </div>
            <div>
              <label className="text-xs text-gray-600">Clients</label>
              <input type="number" className="w-full px-3 py-2 border rounded" value={user.settings?.pollInterval_clients || 30000} onChange={e => setUser({ ...user, settings: { ...(user.settings || {}), pollInterval_clients: Number(e.target.value) } })} />
            </div>
            <div>
              <label className="text-xs text-gray-600">IOCs</label>
              <input type="number" className="w-full px-3 py-2 border rounded" value={user.settings?.pollInterval_iocs || 60000} onChange={e => setUser({ ...user, settings: { ...(user.settings || {}), pollInterval_iocs: Number(e.target.value) } })} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
