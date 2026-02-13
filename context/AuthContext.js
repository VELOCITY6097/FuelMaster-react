import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Check } from 'lucide-react';

const AuthContext = createContext();

// --- BRAND THEMES (TWO-TONE) ---
const THEMES = {
    'bpcl': { primary: '#fbbf24', secondary: '#005ba3', bg: '#fffbeb' }, 
    'iocl': { primary: '#f97316', secondary: '#003366', bg: '#fff7ed' }, 
    'hpcl': { primary: '#00418c', secondary: '#ed1c24', bg: '#eff6ff' }, 
    'jio':  { primary: '#00a651', secondary: '#e9da32', bg: '#ecfdf5' },
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
      // 1. Maintenance
      if (settings.downtime_active) {
          setMaintenance({ active: true });
          localStorage.removeItem('fm_station_id');
          setUser(null);
      } else {
          setMaintenance({ active: false });
      }

      // 2. Broadcast - Updates instantly without refresh
      if (settings.broadcast_msg && settings.broadcast_msg.trim() !== "") {
          setBroadcast({ 
              msg: settings.broadcast_msg, 
              type: settings.broadcast_type || 'info',
              updatedAt: settings.updatedAt || Date.now() // Forces banner to update/re-animate
          });
      } else {
          setBroadcast(null);
      }
  }, []);

  // --- BROADCAST LISTENER (Updates Broadcast State Instantly) ---
  const initBroadcastSystem = useCallback(() => {
      // Initial Fetch
      supabase.from('system_settings').select('*').eq('id', 1).single().then(({ data }) => {
          if(data) applySystemSettings({ ...data, updatedAt: Date.now() });
      });

      // Real-time Subscription
      const channel = supabase.channel('global-broadcast')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'system_settings', 
            filter: 'id=eq.1' 
        }, (payload) => {
            console.log("⚡ Broadcast Update Recieved");
            applySystemSettings({ ...payload.new, updatedAt: Date.now() });
        })
        .subscribe();

      return channel;
  }, [applySystemSettings]);

  // --- 1. ROBUST SESSION RESTORE (Prevents Logout on Refresh) ---
  useEffect(() => {
      const initApp = async () => {
          try {
              const storedStationId = localStorage.getItem('fm_station_id');
              const storedRole = localStorage.getItem('fm_user_role');
              const savedId = localStorage.getItem('fm_saved_id');

              if (!storedStationId) throw new Error("No session");

              // A. Fetch Station FIRST (Safe)
              const { data: stData, error: stError } = await supabase
                .from('stations').select('*').eq('station_id', storedStationId).single();

              if (stError || !stData) throw new Error("Session Invalid");

              // B. Fetch Tanks SECOND (Safe - won't kill session if empty)
              const { data: tankData } = await supabase
                .from('tanks').select('*').eq('station_id', storedStationId).order('tank_no');

              // Combine them
              stData.tanks = tankData || [];

              setStation(stData);
              setRole(storedRole || 'manager');
              
              if (storedRole === 'staff') {
                   setUser({ id: savedId || 'Staff', name: 'Staff Member' });
              } else {
                   setUser({ id: stData.manager_user, name: 'Manager' });
              }

              loadAssets();
          } catch (err) {
              // Only clear session if strictly invalid (not on network error)
              if(err.message === "Session Invalid" || err.message === "No session") {
                  localStorage.removeItem('fm_station_id');
                  setStation(null);
                  setUser(null);
              }
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
      const broadcastChannel = initBroadcastSystem();
      return () => { if (broadcastChannel) supabase.removeChannel(broadcastChannel); };
  }, [initBroadcastSystem]);

  // --- 2. REAL-TIME STATION & TANK LISTENER (Live Updates) ---
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

    // Channel 1: Watch Station Changes (Theme, Name)
    const stationSub = supabase.channel(`station-watch-${station.station_id}`)
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'stations', filter: `station_id=eq.${station.station_id}` }, 
            (payload) => {
                // Merge updates, preserve tanks array
                setStation(prev => ({ ...prev, ...payload.new, tanks: prev.tanks })); 
                showToast("Station Profile Updated");
            }
        ).subscribe();

    // Channel 2: Watch Tank Changes (Add, Rename, Remove) - Updates Count Instantly
    const tankSub = supabase.channel(`tanks-watch-${station.station_id}`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'tanks', filter: `station_id=eq.${station.station_id}` },
            async () => {
                // Fetch fresh tank list
                const { data: newTanks } = await supabase
                    .from('tanks').select('*').eq('station_id', station.station_id).order('tank_no');
                
                if(newTanks) {
                    setStation(prev => ({ ...prev, tanks: newTanks }));
                    showToast("Tank Layout Updated");
                }
            }
        ).subscribe();

    return () => {
        supabase.removeChannel(stationSub);
        supabase.removeChannel(tankSub);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station?.station_id, station?.theme]);

  // --- ACTIONS ---
  const login = async (id, pass) => {
     if (!navigator.onLine) throw new Error("No Internet Connection");
     
     // 1. Check Manager
     let { data: stData, error } = await supabase.from('stations').select('*').eq('manager_user', id).eq('manager_pass', pass).maybeSingle();
     
     if(error) throw new Error("Connection Failed. Check Internet.");
     let userInfo = { id: id, name: 'Manager' };

     // 2. Check Staff
     if(!stData) {
         const { data: staff } = await supabase.from('staff').select('*, stations(*)').eq('phone', id).eq('pin', pass).maybeSingle();
         if(staff) { 
             stData = staff.stations; 
             setRole('staff');
             userInfo = { id: staff.phone, name: staff.name };
         }
     }
     
     if(!stData) throw new Error("Invalid ID or Password");
     
     // 3. Fetch Tanks Manually (Ensures data consistency)
     const { data: tanks } = await supabase.from('tanks').select('*').eq('station_id', stData.station_id).order('tank_no');
     stData.tanks = tanks || [];

     localStorage.setItem('fm_station_id', stData.station_id);
     localStorage.setItem('fm_user_role', role);
     setStation(stData);
     setUser(userInfo);
     loadAssets();
  };

  const logout = () => {
    localStorage.removeItem('fm_station_id');
    localStorage.removeItem('fm_user_role');
    setStation(null);
    setUser(null);
    window.location.href = '/login';
  };

  const showAlert = (msg, title="Notice", onConfirm=null) => setAlertState({ show: true, msg, title, onConfirm });
  const closeAlert = () => setAlertState({ show: false, msg: '', title: '', onConfirm: null });

  return (
    <AuthContext.Provider value={{ user, station, role, systemAssets, maintenance, broadcast, sysStatus, loading, runSystemCheck, login, logout, showAlert, showToast }}>
      {!loading && children}
      
      {/* GLOBAL ALERTS & TOASTS */}
      {alertState.show && (
         <div className="custom-alert-overlay" style={{ display: 'flex' }}>
            <div className="custom-alert-box animate__animated animate__zoomIn">
                <h3>{alertState.title}</h3>
                <p>{alertState.msg}</p>
                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '20px' }}>
                    {alertState.onConfirm && (
                        <button 
                            className="secondary-btn" 
                            style={{ flex: 1, margin: 0, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '12px', fontWeight: '600', height: '48px', cursor: 'pointer' }} 
                            onClick={closeAlert}
                        >
                            Cancel
                        </button>
                    )}
                    <button 
                        className="custom-alert-btn" 
                        style={{ flex: 1, margin: 0, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', height: '48px', cursor: 'pointer', boxShadow: '0 4px 12px var(--primary-glow)' }} 
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