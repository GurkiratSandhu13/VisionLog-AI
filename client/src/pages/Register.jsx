import { useState, useRef } from 'react';
import api from '../services/api';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'student' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);
  
  const fileInput = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !formData.name) {
      setMessage('Name and Photo are required.');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    const d = new FormData();
    d.append('name', formData.name);
    d.append('email', formData.email);
    d.append('role', formData.role);
    d.append('photo', file);

    try {
      // Axios handles multipart/form-data boundary automatically when sending FormData
      const res = await api.post('/users/register', d);
      setMessage(`User ${res.data.name} successfully registered.`);
      setRegisteredUser({ name: res.data.name, photo: preview });
      setFormData({ name: '', email: '', role: 'student' });
      setFile(null);
      // keep preview in registeredUser, clear from main upload
      setPreview(null);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (registeredUser) {
    return (
      <div className="form-wrapper" style={{ textAlign: 'center', padding: '64px 0' }}>
        <h1 className="dashboard-heading" style={{ fontSize: '36px', marginBottom: '40px' }}>Registration Complete</h1>
        <img 
          src={registeredUser.photo} 
          alt="Registered User" 
          style={{ width: '160px', height: '160px', objectFit: 'cover', border: '1px solid #E0DAD0', margin: '0 auto 16px' }} 
        />
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '24px', fontStyle: 'italic', color: 'var(--color-text)' }}>
          {registeredUser.name}
        </p>
        <button className="btn-ghost mt-4" onClick={() => { setRegisteredUser(null); setMessage(''); }}>Register Another</button>
      </div>
    );
  }

  return (
    <div className="form-wrapper">
      <div className="gap-between-sections">
        <h1 className="dashboard-heading" style={{ fontSize: '36px', textAlign: 'center' }}>Platform Registration</h1>
      </div>
      
      {message && (
        <div style={{ padding: '16px', marginBottom: '24px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="input-label">Full Name</label>
          <input className="input-field" value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} />
        </div>
          
        <div className="form-group form-row">
          <div>
            <label className="input-label">Email (Optional)</label>
            <input type="email" className="input-field" value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Role</label>
            <select className="input-field" value={formData.role} onChange={(e)=>setFormData({...formData, role: e.target.value})}>
              <option value="student">Student</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Biometric Photo</label>
          <div className="photo-upload-zone" onClick={() => fileInput.current.click()}>
            {preview ? (
              <img src={preview} alt="Preview" style={{ maxHeight: '192px', objectFit: 'cover', margin: '0 auto', border: '1px solid var(--color-border)' }} />
            ) : (
              <div>
                <p className="photo-upload-text">Click to upload frontal portrait</p>
                <p className="photo-upload-subtext">Requires clear face visibility</p>
              </div>
            )}
            <input type="file" ref={fileInput} style={{ display: 'none' }} accept="image/jpeg, image/png" onChange={handleFileChange} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
          {loading ? 'Processing...' : 'Register Profile'}
        </button>
      </form>
    </div>
  );
}
