import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import BroadcastBanner from '../../components/common/BroadcastBanner';
import { 
  Activity, 
  Thermometer, 
  Cylinder, 
  FileCheck, 
  Info, 
  RefreshCw, 
  FileText, 
  UserCircle 
} from 'lucide-react';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { station, user, sysStatus, runSystemCheck, broadcast } = useAuth();

  return (
    <div className="app-layout">
      <Navbar title="FUELMASTER" isHome={true} />
      
      <main className="main-content">
         
         {/* REAL-TIME BROADCAST BANNER */}
         <BroadcastBanner 
            msg={broadcast?.msg} 
            type={broadcast?.type} 
            updatedAt={broadcast?.updatedAt} 
         />

         {/* SYSTEM STATUS CARD */}
         <div className="system-status-card">
            <div className="status-header">
                <div className="live-indicator">
                    <span className={`pulse-dot ${sysStatus.pulse}`}></span>
                    <span className="status-text" style={{color: sysStatus.pulse === 'green' ? 'var(--success)' : 'var(--warning)'}}>
                        {sysStatus.text}
                    </span>
                </div>
                {/* Manual Sync Trigger */}
                <button className="icon-btn-refresh" onClick={runSystemCheck}>
                    <RefreshCw size={16}/>
                </button>
            </div>
            <div className="status-details">
                {sysStatus.checks.map((check, i) => (
                    <div key={i} className="success-item" style={{display:'flex', alignItems:'center', gap:5, fontSize:'0.75rem', color: sysStatus.pulse === 'green' ? 'var(--success)' : 'var(--text-muted)'}}>
                        {check.icon} {check.label}
                    </div>
                ))}
            </div>
         </div>

         {/* WELCOME SECTION */}
         <div className="welcome-card animate__animated animate__fadeIn">
            <div className="welcome-text">
                <span className="sub-welcome">Welcome, {user?.name || 'Manager'}</span>
                <h2>{station?.name || 'Station'}</h2>
                <div style={{fontSize:'0.85rem', opacity:0.8}}>
                    ID: {user?.id}
                </div>
            </div>
            <Activity className="welcome-icon" size={48} style={{opacity:0.2}}/>
         </div>

         {/* APP NAVIGATION GRID */}
         <div className="nav-grid">
            <button className="nav-card" onClick={() => navigate('/density')}>
                <div className="icon-box blue"><Thermometer /></div>
                <span>Density</span>
            </button>
            <button className="nav-card" onClick={() => navigate('/stocks')}>
                <div className="icon-box orange"><Cylinder /></div>
                <span>Stocks</span>
            </button>
            <button className="nav-card" onClick={() => navigate('/variance')}>
                <div className="icon-box green"><FileCheck /></div>
                <span>Variance</span>
            </button>
            <button className="nav-card" onClick={() => navigate('/compliance')}>
                <div className="icon-box purple" style={{background:'#8b5cf6'}}><FileText /></div>
                <span style={{fontSize:'0.75rem'}}>Reminders</span>
            </button>
            <button className="nav-card" onClick={() => navigate('/about')}>
                <div className="icon-box red" style={{background:'#ef4444'}}><UserCircle /></div>
                <span>Owner</span>
            </button>
         </div>

         {/* INFORMATION CARD */}
         <div className="info-card">
            <h3><Info size={16}/> Anti-Piracy Warning</h3>
            <p style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>
                Any unauthorized duplication, modification, or distribution of this software will be subject to strict legal consequences.
            </p>
         </div>

         <footer className="app-footer">
            <p>Made with <span className="heart">♥</span> by <strong>Velocity6097</strong></p>
         </footer>
      </main>
    </div>
  );
};

export default ClientDashboard;