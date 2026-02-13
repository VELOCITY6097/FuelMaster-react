import React from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Code2, Globe, Heart, ShieldCheck } from 'lucide-react';

const About = () => {
  const { station } = useAuth();
  
  return (
    <div className="app-layout">
      {/* Navbar with updated title */}
      <Navbar title="Developer Profile" />
      
      <main className="main-content">
         {/* Developer Header Card */}
         <div className="welcome-card animate__animated animate__fadeIn">
            <div className="welcome-text">
                <span className="sub-welcome">Lead Developer</span>
                <h2>Velocity6097</h2>
                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '5px' }}>
                    Building the future of Fuel Management
                </div>
            </div>
            <Code2 className="welcome-icon" size={48} style={{ opacity: 0.2 }} />
         </div>

         {/* The Vision Section */}
         <div className="content-card">
            <h3 style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 15 }}>
                <Heart size={20} color="var(--danger)" /> The Vision
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                FuelMaster was built with a simple goal: to eliminate manual calculation errors and modernize the daily operations of fuel stations. 
                By providing real-time density checks and precise stock volume calculations, we ensure that station managers have the data they need at their fingertips.
            </p>
         </div>

         {/* Developer Details Section */}
         <div className="content-card">
            <h3>Developer Details</h3>
            
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Developer Identity */}
                <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                    <div className="icon-box blue"><User size={20} /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NAME / HANDLE</div>
                        <div style={{ fontWeight: 600 }}>Velocity6097</div>
                    </div>
                </div>

                {/* Tech & Security */}
                <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                    <div className="icon-box green"><ShieldCheck size={20} /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SYSTEM STATUS</div>
                        <div style={{ fontWeight: 600 }}>System v3.9 | Auto-Sync Active</div>
                    </div>
                </div>

                {/* Region */}
                <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                    <div className="icon-box orange"><Globe size={20} /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REGION</div>
                        <div style={{ fontWeight: 600 }}>{station?.location || 'India'}</div>
                    </div>
                </div>

                {/* Contact Email Placeholder */}
                <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                    <div className="icon-box purple" style={{ background: '#8b5cf6' }}><Mail size={20} /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUPPORT & FEEDBACK</div>
                        <div style={{ fontWeight: 600 }}>velocity6097.dev@gmail.com</div>
                    </div>
                </div>
            </div>
         </div>

         <footer className="app-footer">
            <p>Made with <span className="heart">♥</span> by <strong>Velocity6097</strong></p>
         </footer>
      </main>
    </div>
  );
};

export default About;