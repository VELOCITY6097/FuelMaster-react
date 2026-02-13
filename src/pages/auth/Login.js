import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Droplet, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
    
    // Auto-fill (Only runs if user is NOT logged in)
    const savedId = localStorage.getItem('fm_saved_id');
    const savedPass = localStorage.getItem('fm_saved_pass');
    if (savedId) setId(savedId); // Always fill ID if available
    if (savedPass) {
        setPass(savedPass);
        setRemember(true);
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); 
    
    try {
      await login(id, pass); 
      
      // --- FIXED LOGIC HERE ---
      // We ALWAYS keep 'fm_saved_id' because AuthContext needs it for the session.
      // We only manage 'fm_saved_pass' based on the checkbox.
      
      if (remember) {
          localStorage.setItem('fm_saved_pass', pass);
          // Note: AuthContext already saves fm_saved_id, so we don't strictly need to do it here,
          // but doing it again doesn't hurt.
      } else {
          // Only remove the password. 
          // DO NOT remove 'fm_saved_id' or you break the refresh capability.
          localStorage.removeItem('fm_saved_pass');
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Connection Failed. Please try again.");
      setLoading(false); 
    }
  };

  return (
    <div className="login-wrapper" style={{display: 'flex'}}>
      <div className="login-card animate__animated animate__fadeInUp">
        <div className="brand-header">
            <div className="brand-lockup large centered">
                <Droplet className="brand-icon" size={36} />
                <div className="brand-text">
                    <span className="txt-fm">FUEL</span>
                    <span className="txt-admin">MASTER</span>
                </div>
            </div>
            <p style={{marginTop:10, opacity:0.7}}>Station Manager Access</p>
        </div>
        
        <form onSubmit={handleSubmit}>
            <div className="input-group">
                <label>Manager ID</label>
                <input type="tel" value={id} onChange={e=>setId(e.target.value)} placeholder="e.g. 9875345863" required />
            </div>
            <div className="input-group">
                <label>Password</label>
                <div className="pass-wrapper">
                    <input type={showPass ? "text" : "password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••" required />
                    <button type="button" className="toggle-pass-btn" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
                    </button>
                </div>
            </div>
            <div className="remember-row">
                <label className="custom-checkbox">
                    <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} />
                    <span className="checkmark"></span>
                    <span className="label-text">Remember Me</span>
                </label>
            </div>
            <button type="submit" className="primary-btn full-width" disabled={loading}>
                {loading ? (
                    <><div className="spinner-mini"></div> Connecting...</>
                ) : (
                    <>Connect Station <ArrowRight size={20}/></>
                )}
            </button>
        </form>
        <p className="login-footer">System v3.9 | Auto Sync</p>
        <p className="error-text">{error}</p>
      </div>
    </div>
  );
};

export default Login;