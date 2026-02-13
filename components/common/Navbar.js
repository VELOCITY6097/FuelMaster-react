import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Users, Fuel } from 'lucide-react'; // Import Icons
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ title, isHome }) => {
  const navigate = useNavigate();
  const { logout, role } = useAuth();

  return (
    <header className="mobile-header">
      <div className="header-brand" onClick={() => navigate('/dashboard')}>
        {isHome ? (
            <div style={{display:'flex', alignItems:'center', gap:5}}>
                <Fuel color="var(--primary)" />
                <span className="brand-mini">FUEL<b>MASTER</b></span>
            </div>
        ) : (
            <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft /></button>
        )}
      </div>
      
      {!isHome && <h3 style={{fontSize:'1rem', fontWeight:700}}>{title}</h3>}

      <div className="header-actions" style={{display:'flex', gap:10}}>
        {/* STAFF BUTTON: Only show if Home AND Manager */}
        {isHome && role === 'manager' && (
            <button className="menu-btn" onClick={() => navigate('/staff')}>
                <Users size={20}/>
            </button>
        )}
        
        {/* LOGOUT BUTTON */}
        <button className="menu-btn" onClick={() => logout()} style={{color:'var(--danger)'}}>
            <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;