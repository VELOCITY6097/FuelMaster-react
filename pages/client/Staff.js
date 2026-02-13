import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Plus, User, ShieldAlert } from 'lucide-react';

const Staff = () => {
  const { station, showAlert, showToast } = useAuth(); // 🔥 Get showAlert from Context
  const [staffList, setStaffList] = useState([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    if (!station) return;
    const { data } = await supabase
      .from('staff')
      .select('*')
      .eq('station_id', station.station_id)
      .order('name');
    setStaffList(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, [station]);

  const addStaff = async () => {
    if (!newName || !newPhone || !newPin) return showAlert("Please fill all fields", "Missing Info");
    
    const { error } = await supabase.from('staff').insert({
        station_id: station.station_id,
        name: newName, 
        phone: newPhone, 
        pin: newPin
    });

    if (error) {
        showAlert(error.message, "Error");
    } else {
        setNewName(''); setNewPhone(''); setNewPin('');
        showToast("Staff Added Successfully");
        fetchStaff();
    }
  };

  // 🔥 FIXED: Using the custom popup for deletion
  const removeStaff = (id, name) => {
    showAlert(
      `Are you sure you want to remove ${name}? This action cannot be undone.`,
      "Confirm Deletion",
      async () => {
        // This code only runs if the user clicks "OK" in your custom popup
        const { error } = await supabase.from('staff').delete().eq('id', id);
        if (error) {
          showAlert(error.message, "Error");
        } else {
          showToast("Staff Member Removed");
          fetchStaff();
        }
      }
    );
  };

  return (
    <div className="app-layout">
      <Navbar title="Staff Management" />
      <main className="main-content">
        <div className="content-card animate__animated animate__fadeIn">
            <h3>Add New Staff</h3>
            <div className="input-group" style={{marginTop: 15}}>
                <label>Staff Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Rahul Kumar" />
            </div>
            <div style={{display:'flex', gap:10}}>
                <div className="input-group" style={{flex: 1}}>
                    <label>Phone / Login ID</label>
                    <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone Number" type="tel" />
                </div>
                <div className="input-group" style={{width: 100}}>
                    <label>PIN</label>
                    <input value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="0000" type="password" maxLength="4" />
                </div>
            </div>
            <button onClick={addStaff} className="primary-btn" style={{marginTop:5}}>
                <Plus size={18}/> Add Staff
            </button>
        </div>

        <h3 style={{marginTop:20, marginLeft:5, color:'var(--text-muted)', fontSize:'0.9rem', textTransform:'uppercase'}}>Active Staff Members</h3>
        <div className="staff-list" style={{marginTop:10}}>
            {loading ? (
                <div style={{textAlign:'center', padding:20}}><div className="spinner-mini darker"></div></div>
            ) : staffList.length === 0 ? (
                <p style={{textAlign:'center', padding:20, color:'var(--text-light)'}}>No staff members found.</p>
            ) : staffList.map(s => (
                <div key={s.id} className="content-card" style={{padding:15, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center', borderRadius:16}}>
                    <div style={{display:'flex', gap:12, alignItems:'center'}}>
                        <div style={{background:'var(--primary-light)', padding:10, borderRadius:'50%'}}>
                            <User size={20} color="var(--primary)"/>
                        </div>
                        <div>
                            <div style={{fontWeight:700, fontSize:'1rem'}}>{s.name}</div>
                            <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>
                                ID: {s.phone} | PIN: {s.pin}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => removeStaff(s.id, s.name)} 
                        style={{background:'none', border:'none', color:'var(--danger)', padding:10, cursor:'pointer'}}
                    >
                        <Trash2 size={20}/>
                    </button>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
};

export default Staff;