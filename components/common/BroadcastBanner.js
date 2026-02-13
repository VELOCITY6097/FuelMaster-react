import React, { useState, useEffect } from 'react';
import { Info, AlertTriangle, AlertOctagon, X } from 'lucide-react';

const BroadcastBanner = ({ msg, type = 'info', updatedAt }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // 🔁 React to new Broadcasts instantly
  useEffect(() => {
    if (msg) {
      // 1. Hide briefly to reset animation state
      setIsVisible(false);
      setShowPopup(false);
      
      // 2. Show again after a split second
      const timer = setTimeout(() => {
          setIsVisible(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [updatedAt, msg]); // 🔥 Dependent on timestamp from DB

  if (!msg || !isVisible) return null;

  const icons = {
    info: <Info size={20} />,
    warning: <AlertTriangle size={20} />,
    critical: <AlertOctagon size={20} />
  };

  const selectedIcon = icons[type] || icons.info;

  return (
    <>
      {/* Banner Strip */}
      <div
        className={`broadcast-banner ${type} animate__animated animate__slideInDown`}
        onClick={() => setShowPopup(true)}
      >
        <div className="broadcast-icon-box">
          {selectedIcon}
        </div>

        <div className="broadcast-marquee">
          <span className="broadcast-text">
            {msg}
            <span className="click-hint"> &nbsp;• Tap for details •&nbsp; </span>
            {msg}
          </span>
        </div>

        <button
          className="broadcast-close"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="custom-alert-overlay" style={{ display: 'flex', zIndex: 100002 }}>
          <div className="broadcast-popup-card animate__animated animate__zoomIn">
            <div className={`broadcast-popup-header ${type}`} style={{ padding: 20, display: 'flex', gap: 10, alignItems: 'center', color: 'white' }}>
              {selectedIcon}
              <h3 style={{ margin: 0, flex: 1 }}>System Broadcast</h3>
              <button onClick={() => setShowPopup(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X />
              </button>
            </div>

            <div className="broadcast-popup-body" style={{ padding: 25, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {msg}
            </div>

            <div className="broadcast-popup-footer" style={{ padding: 15, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="primary-btn" onClick={() => setShowPopup(false)} style={{ width: 'auto', padding: '10px 25px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BroadcastBanner;