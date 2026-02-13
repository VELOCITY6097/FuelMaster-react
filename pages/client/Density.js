import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle } from 'lucide-react';

const Density = () => {
  const { systemAssets, showAlert } = useAuth();
  const [temp, setTemp] = useState('');
  const [den, setDen] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false); // <--- Animation State

  const calculate = async () => {
    if (!temp || !den) return showAlert("Please enter valid values.");

    // 1. Start Animation
    setLoading(true);
    setResult(null);

    // 2. Delay (Simulate Calculation)
    await new Promise(r => setTimeout(r, 800));

    // 3. Logic
    const t = parseFloat(temp);
    const d = parseFloat(den);
    const roundedTemp = (Math.round(t * 2) / 2).toFixed(1);
    const table = systemAssets.density;

    if (!table || !table[roundedTemp]) {
        setLoading(false);
        return showAlert("Temperature out of range.");
    }

    const index = Math.round(d - 700);
    const val = table[roundedTemp][index];

    setLoading(false); // Stop Animation
    if (!val) return showAlert("Density out of range.");
    
    setResult(val);
  };

  return (
    <div className="app-layout">
      <Navbar title="Density Calculator" />
      <main className="main-content">
        <div className="content-card">
            <div className="input-group">
                <label>Observed Density</label>
                <input type="number" value={den} onChange={e=>setDen(e.target.value)} placeholder="e.g. 745"/>
            </div>
            <div className="input-group">
                <label>Temperature (°C)</label>
                <input type="number" value={temp} onChange={e=>setTemp(e.target.value)} placeholder="e.g. 29.5"/>
            </div>
            
            <div className="grid-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:20}}>
                <button className="secondary-btn" onClick={() => {setTemp(''); setDen(''); setResult(null);}}>Reset</button>
                
                {/* BUTTON WITH SPINNER */}
                <button className="primary-btn" onClick={calculate} disabled={loading}>
                    {loading ? (
                        <>
                            <div className="spinner-mini"></div> Calculating...
                        </>
                    ) : (
                        "Calculate"
                    )}
                </button>
            </div>

            {result && (
                <div className="result-box pop-in" style={{marginTop:20, background:'var(--primary-light)', padding:20, borderRadius:16, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                        <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Density @ 15°C</span>
                        <div style={{fontSize:'1.8rem', fontWeight:800, color:'var(--primary)'}}>{result} <small>kg/m³</small></div>
                    </div>
                    <CheckCircle color="var(--primary)" size={32} />
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Density;