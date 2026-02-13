import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Check } from 'lucide-react';

const AuthContext = createContext();

// --- BRAND THEMES ---
const THEMES = {
    'bpcl': { 
        primary: '#fbbf24',    // BPCL Yellow
        secondary: '#005ba3',  // BPCL Blue
        bg: '#fffbeb' 
    }, 
    'iocl': { 
        primary: '#f97316',    // IOCL Orange
        secondary: '#003366',  // IOCL Navy
        bg: '#fff7ed' 
    }, 
    'hpcl': { 
        primary: '#00418c',    // HPCL Blue
        secondary: '#ed1c24',  // HPCL Red
        bg: '#eff6ff' 
    }, 
    'jio': { 
        primary: '#00a651',    // Jio Green
        secondary: '#e9da32',  // BP Blue
        bg: '#ecfdf5' 
    },
    'default': { 
        primary: '#2563eb', 
        secondary: '#1e3a8a', 
        bg: '#eff6ff' 
    }
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

  // --- ASSET LOADING ---
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

  // --- SYSTEM CHECK ---
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

  // --- BROADCAST & SETTINGS HANDLER ---
  const applySystemSettings = useCallback((settings) => {
      if (!settings) return;

      // 1. Handle Maintenance (Don't auto-logout on refresh, just set state)
      if (settings.downtime_active) {
          setMaintenance({ active: true });
      } else {
          setMaintenance({ active: false });
      }

      // 2. Handle Broadcast
      if (settings.broadcast_msg && settings.broadcast_msg.trim() !== "") {
          setBroadcast({ 
              msg: settings.broadcast_msg, 
              type: settings.broadcast_type || 'info',
              updatedAt: Date.now() 
          });
      } else {
          setBroadcast(null);
      }
  }, []);

  // --- INITIALIZATION ---
  useEffect(() => {
      let broadcastSub = null;

      const initApp = async () => {
          try {
              // A. Start Broadcast Listener Immediately
              const { data: settings } = await supabase.from('system_settings').select('*').eq('id', 1).single();
              if (settings) applySystemSettings(settings);

              broadcastSub = supabase.channel('global-broadcast')
                  .on('postgres_changes', 
                      { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'id=eq.1' }, 
                      (payload) => applySystemSettings(payload.new)
                  )
                  .subscribe();

              // B. Handle User Session
              const storedStationId = localStorage.getItem('fm_station_id');
              const storedRole = localStorage.getItem('fm_user_role');
              const savedId = localStorage.getItem('fm_saved_id');

              if (!storedStationId) {
                  setLoading(false); // No user, stop loading
                  return; 
              }

              // Fetch Station AND Tanks
              const { data, error } = await supabase
                .from('stations').select('*, tanks(*)').eq('station_id', storedStationId).single();

              if (error || !data) {
                  // Only clear session if strictly invalid, not on network error
                  if (error.code === 'PGRST116') { // Record not found
                       localStorage.removeItem('fm_station_id');
                       setUser(null);
                       setStation(null);
                  }
                  throw new Error("Session Invalid");
              }

              setStation(data);
              setRole(storedRole || 'manager');
              
              if (storedRole === 'staff') {
                   setUser({ id: savedId || 'Staff', name: 'Staff Member' });
              } else {
                   setUser({ id: data.manager_user, name: 'Manager' });
              }

              loadAssets();
          } catch (err) {
              console.error("Init Error:", err);
          } finally {
              setLoading(false);
              // Remove Loader
              const loader = document.getElementById('app-loader');
              if(loader) {
                  loader.style.opacity = '0';
                  setTimeout(() => loader.remove(), 500);
              }
          }
      };

      initApp();

      return () => {
          if (broadcastSub) supabase.removeChannel(broadcastSub);
      };
  }, [applySystemSettings]);

  // --- REAL-TIME STATION SYNC ---
  useEffect(() => {
    if(!station?.station_id) return;
    
    // Apply Theme
    const t = THEMES[station.theme] || THEMES['default'];
    const root = document.documentElement.style;
    root.setProperty('--primary', t.primary);
    root.setProperty('--primary-dark', t.secondary); 
    root.setProperty('--primary-light', t.bg);
    root.setProperty('--primary-glow', t.primary + '40');

    if(!sysStatus.checked) runSystemCheck();

    // Sync Station Data
    const stationSub = supabase.channel(`station-updates-${station.station_id}`)
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'stations', filter: `station_id=eq.${station.station_id}` }, 
            (payload) => {
                setStation(prev => ({ ...prev, ...payload.new })); 
                showToast("Station Data Updated");
            }
        ).subscribe();

    // Sync Tank Data
    const tankSub = supabase.channel(`tank-updates-${station.station_id}`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'tanks', filter: `station_id=eq.${station.station_id}` },
            async () => {
                const { data: newTanks } = await supabase.from('tanks').select('*').eq('station_id', station.station_id).order('tank_no');
                if(newTanks) {
                    setStation(prev => ({ ...prev, tanks: newTanks }));
                    showToast("Tank Levels Updated");
                }
            }
        ).subscribe();

    return () => {
        supabase.removeChannel(stationSub);
        supabase.removeChannel(tankSub);
    };
  }, [station?.station_id, station?.theme]);

  // --- LOGIN / LOGOUT ---
  const login = async (id, pass) => {
      if (!navigator.onLine) throw new Error("No Internet Connection");
      let { data: stData, error } = await supabase.from('stations').select('*').eq('manager_user', id).eq('manager_pass', pass).maybeSingle();
      
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

      // Save to Storage
      localStorage.setItem('fm_station_id', stData.station_id);
      localStorage.setItem('fm_user_role', finalRole);
      localStorage.setItem('fm_saved_id', userInfo.id);

      // Set State
      setRole(finalRole);
      setStation(stData);
      setUser(userInfo);
      loadAssets();
  };

  const logout = () => {
    localStorage.removeItem('fm_station_id');
    localStorage.removeItem('fm_user_role');
    localStorage.removeItem('fm_saved_id');
    setStation(null);
    setUser(null);
    window.location.href = '/login';
  };

  const showAlert = (msg, title="Notice", onConfirm=null) => setAlertState({ show: true, msg, title, onConfirm });
  const closeAlert = () => setAlertState({ show: false, msg: '', title: '', onConfirm: null });

  return (
    <AuthContext.Provider value={{ user, station, role, systemAssets, maintenance, broadcast, sysStatus, loading, runSystemCheck, login, logout, showAlert, showToast }}>
      {!loading && children}
      
      {/* GLOBAL ALERTS */}
      {alertState.show && (
         <div className="custom-alert-overlay" style={{ display: 'flex' }}>
            <div className="custom-alert-box animate__animated animate__zoomIn">
                <h3>{alertState.title}</h3>
                <p>{alertState.msg}</p>
                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '20px' }}>
                    {alertState.onConfirm && (
                        <button className="secondary-btn" onClick={closeAlert}>Cancel</button>
                    )}
                    <button 
                        className="custom-alert-btn" 
                        style={{ background: 'var(--primary)', flex: 1 }} 
                        onClick={() => { 
                            if (alertState.onConfirm) alertState.onConfirm(); 
                            closeAlert(); 
                        }}
                    >
                        {alertState.onConfirm ? 'Confirm' : 'OK'}
                    </button>
                </div>
            </div>
         </div>
      )}  
      {toast && <div className="update-toast"><Check size={14}/> {toast}</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);