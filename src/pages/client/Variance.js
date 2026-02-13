import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { FileCheck, Check, X, AlertTriangle, ShieldAlert } from 'lucide-react';

const Variance = () => {
  const { systemAssets, showAlert } = useAuth();
  const [obsDen, setObsDen] = useState('');
  const [temp, setTemp] = useState('');
  const [challan, setChallan] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!obsDen || !temp || !challan) return showAlert("Please fill all fields");

    setLoading(true);
    setResult(null);

    await new Promise(r => setTimeout(r, 800));

    if (!systemAssets || !systemAssets.density) {
        setLoading(false);
        return showAlert("System assets not loaded. Please refresh.");
    }

    const tObs = parseFloat(obsDen);
    const tTemp = parseFloat(temp);
    const tChal = parseFloat(challan);

    // 1. Calculate Standard Density
    const roundedTemp = (Math.round(tTemp * 2) / 2).toFixed(1);
    const table = systemAssets.density;

    if (!table[roundedTemp]) {
        setLoading(false);
        return showAlert("Temperature out of range (0-50°C)");
    }

    const idx = Math.round(tObs - 700);
    if (idx < 0 || idx >= table[roundedTemp].length) {
         setLoading(false);
         return showAlert("Density out of range (700-1000)");
    }

    const calcStd = table[roundedTemp][idx]; // Density @ 15°C
    const diff = (calcStd - tChal).toFixed(1);
    const isPass = Math.abs(diff) <= 3.0; // Tolerance +/- 3.0

    setResult({ calcStd, diff, isPass, tChal });
    setLoading(false);
  };

  const handleReset = () => {
      setObsDen('');
      setTemp('');
      setChallan('');
      setResult(null);
  };

  return (
    <div className="app-layout">
      <Navbar title="Invoice Audit" />
      <main className="main-content">
        <div className="content-card">
            <div className="input-group">
                <label>Tanker Observed Density</label>
                <input type="number" value={obsDen} onChange={e => setObsDen(e.target.value)} placeholder="e.g. 745" inputMode="decimal"/>
            </div>
            <div className="input-group">
                <label>Tanker Temperature (°C)</label>
                <input type="number" value={temp} onChange={e => setTemp(e.target.value)} placeholder="e.g. 29.5" inputMode="decimal"/>
            </div>
            <div className="input-group">
                <label>Invoice Density (Challan)</label>
                <input type="number" value={challan} onChange={e => setChallan(e.target.value)} placeholder="e.g. 756.2" inputMode="decimal"/>
            </div>

            <div className="grid-2">
                <button className="secondary-btn" onClick={handleReset}>Reset</button>
                <button className="primary-btn" onClick={verify} disabled={loading}>
                     {loading ? (
                         <><div className="spinner-mini"></div> Verifying...</>
                     ) : (
                         "Verify Invoice"
                     )}
                </button>
            </div>

            {result && (
                <div className={`audit-result ${result.isPass ? 'pass' : 'fail'}`} 
                     style={!result.isPass ? {background:'#fef2f2', border:'2px solid #ef4444'} : {}}>
                    
                    <div className="audit-icon">
                        {result.isPass ? <Check size={32} /> : <X size={32} />}
                    </div>

                    {/* DYNAMIC HEADER TEXT */}
                    <h3>{result.isPass ? 'AUDIT PASSED' : 'AUDIT FAILED'}</h3>

                    {/* CRITICAL WARNING IF FAILED */}
                    {!result.isPass && (
                        <div style={{
                            background:'#ef4444', color:'white', width:'100%', 
                            padding:'15px', borderRadius:'12px', marginTop:'10px',
                            textAlign:'center', animation:'pulse-red 2s infinite'
                        }}>
                            <div style={{display:'flex', justifyContent:'center', marginBottom:'5px'}}>
                                <ShieldAlert size={32} />
                            </div>
                            <h2 style={{fontSize:'1.2rem', fontWeight:800, margin:'5px 0'}}>DO NOT UNLOAD</h2>
                            <p style={{fontSize:'0.9rem', fontWeight:600, opacity:0.9}}>VARIANCE TOO HIGH</p>
                            <div style={{marginTop:'10px', background:'rgba(0,0,0,0.2)', padding:'8px', borderRadius:'8px', fontSize:'0.85rem'}}>
                                ACTION: Redo Density Check
                            </div>
                        </div>
                    )}

                    {/* DETAILS SECTION */}
                    <div style={{width:'100%', marginTop:15, borderTop:'1px solid rgba(0,0,0,0.1)', paddingTop:10, fontSize:'0.9rem'}}>
                         <div style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
                             <span style={{opacity:0.7}}>Calculated (15°C):</span> 
                             <b>{result.calcStd.toFixed(1)}</b>
                         </div>
                         <div style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
                             <span style={{opacity:0.7}}>Invoice (Challan):</span> 
                             <b>{result.tChal.toFixed(1)}</b>
                         </div>
                         <div style={{display:'flex', justifyContent:'space-between', marginTop:8, fontSize:'1rem'}}>
                             <span>Variance:</span> 
                             <b style={{color: result.isPass ? 'var(--success)' : 'var(--danger)'}}>
                                 {result.diff > 0 ? '+' : ''}{result.diff}
                             </b>
                         </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Variance;