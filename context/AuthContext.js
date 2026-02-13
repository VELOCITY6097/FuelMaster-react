import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Check } from 'lucide-react';

const AuthContext = createContext();

// --- BRAND THEMES ---
const THEMES = {
    'bpcl': { primary: '#fbbf24', secondary: '#005ba3', bg: '#fffbeb' }, 
    'iocl': { primary: '#f97316', secondary: '#003366', bg: '#fff7ed' }, 
    'hpcl': { primary: '#00418c', secondary: '#ed1c24', bg: '#eff6ff' }, 
    'jio': { primary: '#00a651', secondary: '#e9da32', bg: '#ecfdf5' },
    'default': { primary: '#2563eb', secondary: '#1e3a8a', bg: '#eff6ff' }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [station, setStation] = useState(null);
  const [role, setRole] = useState('manager');
  const [loading, setLoading] = useState(true); 
  
  const [systemAssets, setSystemAssets] = useState({ density: null, charts: null });
  const [sysStatus, setSysStatus] = useState({ pulse: 'yellow', text: 'INITIALIZING...', checks: [], checked: false });
  const [maintenance, setMaintenance] = useState({ active: false });
  const [broadcast, setBroadcast] = useState(null);

  const [alertState, setAlertState] = useState({ show: false, msg: '', title: '', onConfirm: null });
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => { 
    setToast(msg); 
    setTimeout(() => setToast(null), 3000); 
  }, []);

  const loadAssets = async () => {
      try {
        const { data: c } = await supabase.from('system_assets').select('data').eq('key', 'tank_charts').single();
        const { data: d } = await supabase.from('system_assets').select('data').eq('key', 'density_table').single();
        setSystemAssets({ charts: c?.data, density: d?.data });
        return true;
      } catch(e) { 
        console.error("Asset Load Error", e);
        return false;
      }
  };

  const runSystemCheck = async (force = false) => {
      if (sysStatus.pulse === 'green' && !force) return;
      setSysStatus(p => ({ ...p, pulse: 'yellow', text: 'SYNCING...' }));
      await new Promise(r => setTimeout(r, 800));

      let assets = systemAssets;
      if (!assets.density || !assets.charts) {
           await loadAssets();
           const { data: c } = await supabase.from('system_assets').select('data').eq('key', 'tank_charts').single();
           const { data: d } = await supabase.from('system_assets').select('data').eq('key', 'density_table').single();
           assets = { charts: c?.data, density: d?.data };
           setSystemAssets(assets);
      }

      if (station && assets.density && assets.charts) {
          setSysStatus({
              pulse: 'green', text: 'ALL SYSTEMS LIVE', checked: true,
              checks: [
                  { label: 'Database Connected', icon: <Check size={12}/> },
                  { label: 'Admin Panel Active', icon: <Check size={12}/> },
                  { label: `${station.tanks?.length || 0} Tanks Configured`, icon: <Check size={12}/> }
              ]
          });
      } else {
          setSysStatus({ 
              pulse: 'red', text: 'ASSET LOAD ERROR', checked: true,
              checks: [{ label: 'Check Internet Connection', icon: null }] 
          });
      }
  };

  const applySystemSettings = useCallback((settings) => {
      if (!settings) return;

      setMaintenance({ active: !!settings.downtime_active });

      // FIX: Ensure immediate reflection of type change and handle blank msg removal
      const msgContent = settings.broadcast_msg ? settings.broadcast_msg.trim() : "";
      if (msgContent !== "") {
          setBroadcast({ 
              msg: msgContent, 
              type: settings.broadcast_type || 'info',
              updatedAt: Date.now() 
          });
      } else {
          setBroadcast(null);
      }
  }, []);

  useEffect(() => {
      let broadcastSub = null;

      const initApp = async () => {
          try {
              // 1. CACHE-FIRST PERSISTENCE (Fixes refresh logout)
              const storedStationId = localStorage.getItem('fm_station_id');
              const storedRole = localStorage.getItem('fm_user_role');
              const savedId = localStorage.getItem('fm_saved_id');
              const cachedData = localStorage.getItem('fm_station_data');

              if (!storedStationId) {
                  setLoading(false);
                  return; 
              }

              // Instant Hydration
              if (cachedData) {
                  const data = JSON.parse(cachedData);
                  setStation(data);
                  setRole(storedRole || 'manager');
                  setUser(storedRole === 'staff' ? { id: savedId || 'Staff', name: 'Staff Member' } : { id: data.manager_user, name: 'Manager' });
              }

              // 2. Settings Sync
              const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 1).single();
              if (settings) applySystemSettings(settings);

              broadcastSub = supabase.channel('global-broadcast')
                  .on('postgres_changes', 
                      { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'id=eq.1' }, 
                      (payload) => applySystemSettings(payload.new)
                  )
                  .subscribe();

              // 3. Remote Session Verification
              const { data, error } = await supabase
                .from('stations').select('*, tanks(*)').eq('station_id', storedStationId).single();

              if (error) {
                  // Only clear session if record is explicitly missing (404/PGRST116)
                  if (error.code === 'PGRST116') { 
                       localStorage.removeItem('fm_station_id');
                       localStorage.removeItem('fm_station_data');
                       setUser(null);
                       setStation(null);
                  }
              } else if (data) {
                  setStation(data);
                  localStorage.setItem('fm_station_data', JSON.stringify(data));
                  setRole(storedRole || 'manager');
                  setUser(storedRole === 'staff' ? { id: savedId || 'Staff', name: 'Staff Member' } : { id: data.manager_user, name: 'Manager' });
                  loadAssets();
              }
          } catch (err) {
              console.error("Init Error:", err);
          } finally {
              setLoading(false);
              const loader = document.getElementById('app-loader');
              if(loader) {
                  loader.style.opacity = '0';
                  setTimeout(() => loader.remove(), 500);
              }
          }
      };

      initApp();
      return () => { if (broadcastSub) supabase.removeChannel(broadcastSub); };
  }, [applySystemSettings]);

  useEffect(() => {
    if(!station?.station_id) return;
    
    const t = THEMES[station.theme] || THEMES['default'];
    const root = document.documentElement.style;
    root.setProperty('--primary', t.primary);
    root.setProperty('--primary-dark', t.secondary); 
    root.setProperty('--primary-light', t.bg);
    root.setProperty('--primary-glow', t.primary + '40');

    if(!sysStatus.checked) runSystemCheck();

    const stationSub = supabase.channel(`station-updates-${station.station_id}`)
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'stations', filter: `station_id=eq.${station.station_id}` }, 
            (payload) => {
                setStation(prev => {
                    const updated = { ...prev, ...payload.new };
                    localStorage.setItem('fm_station_data', JSON.stringify(updated));
                    return updated;
                }); 
                showToast("Station Data Updated");
            }
        ).subscribe();

    const tankSub = supabase.channel(`tank-updates-${station.station_id}`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'tanks', filter: `station_id=eq.${station.station_id}` },
            async () => {
                const { data: newTanks } = await supabase.from('tanks').select('*').eq('station_id', station.station_id).order('tank_no');
                if(newTanks) {
                    setStation(prev => {
                        const updated = { ...prev, tanks: newTanks };
                        localStorage.setItem('fm_station_data', JSON.stringify(updated));
                        return updated;
                    });
                    showToast("Tank Levels Updated");
                }
            }
        ).subscribe();

    return () => {
        supabase.removeChannel(stationSub);
        supabase.removeChannel(tankSub);
    };
  }, [station?.station_id, station?.theme]);

  const login = async (id, pass) => {
      if (!navigator.onLine) throw new Error("No Internet Connection");
      let { data: stData } = await supabase.from('stations').select('*').eq('manager_user', id).eq('manager_pass', pass).maybeSingle();
      
      let finalRole = 'manager';
      let userInfo = { id: id, name: 'Manager' };

      if(!stData) {
          const { data: staff } = await supabase.from('staff').select('*, stations(*)').eq('phone', id).eq('pin', pass).maybeSingle();
          if(staff) { 
              stData = staff.stations; 
              finalRole = 'staff';
              userInfo = { id: staff.phone, name: staff.name };
          }
      }

      if(!stData) throw new Error("Invalid ID or Password");
      
      if (!stData.tanks) {
          const { data: tanks } = await supabase.from('tanks').select('*').eq('station_id', stData.station_id);
          stData.tanks = tanks || [];
      }

      localStorage.setItem('fm_station_id', stData.station_id);
      localStorage.setItem('fm_user_role', finalRole);
      localStorage.setItem('fm_saved_id', userInfo.id);
      localStorage.setItem('fm_station_data', JSON.stringify(stData));

      setRole(finalRole);
      setStation(stData);
      setUser(userInfo);
      loadAssets();
  };

  const logout = () => {
    localStorage.removeItem('fm_station_id');
    localStorage.removeItem('fm_user_role');
    localStorage.removeItem('fm_saved_id');
    localStorage.removeItem('fm_station_data');
    setStation(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, station, role, systemAssets, maintenance, broadcast, sysStatus, loading, runSystemCheck, login, logout, showAlert: (msg, title, onConfirm) => setAlertState({ show: true, msg, title, onConfirm }), showToast }}>
      {!loading && children}
      {alertState.show && (
         <div className="custom-alert-overlay" style={{ display: 'flex' }}>
            <div className="custom-alert-box animate__animated animate__zoomIn">
                <h3>{alertState.title}</h3>
                <p>{alertState.msg}</p>
                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '20px' }}>
                    {alertState.onConfirm && <button className="secondary-btn" onClick={() => setAlertState(p=>({...p, show:false}))}>Cancel</button>}
                    <button className="custom-alert-btn" style={{ background: 'var(--primary)', flex: 1 }} 
                        onClick={() => { if (alertState.onConfirm) alertState.onConfirm(); setAlertState(p=>({...p, show:false})); }}>Confirm</button>
                </div>
            </div>
         </div>
      )}  
      {toast && <div className="update-toast"><Check size={14}/> {toast}</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);