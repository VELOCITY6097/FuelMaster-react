import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { Droplet, Cylinder } from 'lucide-react';

const Stocks = () => {
  const { station, systemAssets, showAlert } = useAuth();
  const [selectedTank, setSelectedTank] = useState(station?.tanks?.[0]);
  const [dip, setDip] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!dip) return showAlert("Please enter a dip reading.");
    
    // Start Loading
    setLoading(true);
    setResult(null); // Clear previous result to prevent confusion

    // Simulate Calculation Delay (Animation)
    await new Promise(r => setTimeout(r, 800));

    let chart = systemAssets.charts?.[`${selectedTank.type}_CHART`] || systemAssets.charts?.[selectedTank.type];
    if (!chart) { 
        setLoading(false); 
        return showAlert("Chart data missing."); 
    }

    const dipVal = parseFloat(dip);
    const dips = Object.keys(chart).map(Number).sort((a, b) => a - b);
    
    // Logic
    let finalVol = 0;
    if (chart[dipVal.toFixed(1)]) finalVol = chart[dipVal.toFixed(1)];
    else {
        let lower = dips.find((d, i) => d <= dipVal && dips[i+1] > dipVal);
        let upper = dips.find(d => d > dipVal);
        if (lower !== undefined && upper !== undefined) {
             const v1 = chart[lower.toFixed(1)] || chart[lower.toFixed(2)];
             const v2 = chart[upper.toFixed(1)] || chart[upper.toFixed(2)];
             finalVol = v1 + ((v2 - v1) / (upper - lower)) * (dipVal - lower);
        }
    }

    setResult(Math.floor(finalVol).toLocaleString());
    setLoading(false); // Stop Loading
  };

  const handleReset = () => {
      setDip('');
      setResult(null);
  };

  return (
    <div className="app-layout">
      <Navbar title="Tank Stocks" />
      <main className="main-content">
        
        {/* WRAP LAYOUT (Fixed Grid) */}
        <div style={{display:'flex', flexWrap:'wrap', gap:10, marginBottom:20}}>
            {station?.tanks?.map(tank => (
                <button key={tank.name} 
                    className={`tank-btn ${selectedTank?.name === tank.name ? 'active' : ''}`}
                    onClick={() => {setSelectedTank(tank); setResult(null);}}
                    style={{flex: '1 0 40%', justifyContent:'center'}}
                >
                    <Cylinder size={16}/> {tank.name}
                </button>
            ))}
        </div>

        <div className="content-card">
            <div className="card-head"><h3>{selectedTank?.name}</h3></div>
            <div className="input-group">
                <label>Dip Reading (cm)</label>
                <input type="number" value={dip} onChange={e=>setDip(e.target.value)} placeholder="e.g. 150.5" inputMode="decimal"/>
            </div>
            
            <div className="grid-2">
                <button className="secondary-btn" onClick={handleReset}>Reset</button>
                <button className="primary-btn" onClick={calculate} disabled={loading}>
                     {loading ? (
                         <><div className="spinner-mini"></div> Calculating...</>
                     ) : (
                         "Calculate"
                     )}
                </button>
            </div>

            {result && (
                <div className="theme-box pop-in" style={{marginTop:20}}>
                    <div>
                        <span className="label">Current Volume</span>
                        <div className="val">{result}<small>L</small></div>
                    </div>
                    <Droplet className="vol-icon" />
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Stocks;