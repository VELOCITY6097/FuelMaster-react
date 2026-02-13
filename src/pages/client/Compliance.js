import React from 'react';
import Navbar from '../../components/common/Navbar';
import { FileText, BellRing, Construction, Info } from 'lucide-react';

const Compliance = () => {
  return (
    <div className="app-layout">
      {/* Navbar with appropriate title */}
      <Navbar title="Compliance Reminders" />
      
      <main className="main-content">
        {/* WIP Header Card */}
        <div className="welcome-card animate__animated animate__fadeIn" style={{ marginBottom: '20px' }}>
          <div className="welcome-text">
            <span className="sub-welcome">Feature Preview</span>
            <h2>Work in Progress</h2>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '5px' }}>
              Building your Automated Reminder System
            </div>
          </div>
          <Construction className="welcome-icon" size={48} style={{ opacity: 0.2 }} />
        </div>

        {/* Details Card */}
        <div className="content-card">
          <h3 style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 15 }}>
            <BellRing size={24} color="var(--primary)" /> Smart Notifications
          </h3>
          
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
            We are currently developing a comprehensive notification system to help station managers stay ahead of critical document renewals.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Feature Description Items */}
            <div style={{ background: 'var(--bg-body)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Automated Alerts</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Receive push notifications 30, 15, and 7 days before any document expires.
              </span>
            </div>

            <div style={{ background: 'var(--bg-body)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Document Tracking</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Track Explosive Licenses, Calibration Certificates, Fire Safety NOCs, and more in one place.
              </span>
            </div>
          </div>

          {/* Status Box */}
          <div className="info-card" style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <Info size={16} /> Development Phase
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '5px' }}>
              This module is being integrated with the cloud database to ensure real-time synchronization across all station devices.
            </p>
          </div>
        </div>

        <footer className="app-footer">
          <p>System v3.9 | Building for the future</p>
        </footer>
      </main>
    </div>
  );
};

export default Compliance;