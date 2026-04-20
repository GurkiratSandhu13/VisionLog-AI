import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.get('/attendance/history').then(res => setSessions(res.data)).catch(console.error);
  }, []);

  const toggleRow = (id) => {
    setExpanded(prev => ({...prev, [id]: !prev[id]}));
  };

  return (
    <div>
      <div className="gap-between-sections flex-row" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '24px' }}>
        <h1 className="dashboard-heading" style={{ fontSize: '36px' }}>Session Archives</h1>
      </div>
      
      <table className="history-table">
        <thead>
          <tr>
            <th>Session Name</th>
            <th>Started At</th>
            <th>Attendees</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(s => (
            <React.Fragment key={s.id}>
              <tr onClick={() => toggleRow(s.id)} style={{ cursor: 'pointer', transition: 'background-color 250ms ease' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-alt)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {s.session_name}
                    {s.submitted_at ? (
                       <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#166534', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px' }}>Submitted</span>
                    ) : (
                       <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#854d0e', backgroundColor: '#fefce8', border: '1px solid #fef08a', padding: '2px 8px' }}>In Progress</span>
                    )}
                  </div>
                </td>
                <td>{new Date(s.started_at).toLocaleString()}</td>
                <td style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{s.participant_count}</td>
              </tr>
              <tr>
                <td colSpan="3" style={{ padding: 0, borderBottom: expanded[s.id] ? '1px solid var(--color-border)' : 'none' }}>
                  <div 
                    style={{ 
                      maxHeight: expanded[s.id] ? '1000px' : '0', 
                      overflow: 'hidden', 
                      transition: 'max-height 300ms ease',
                      backgroundColor: 'var(--color-surface-alt)'
                    }}
                  >
                    <div style={{ padding: '24px 16px' }}>
                      <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                        Session Telemetry Data
                      </p>
                      <p style={{ fontSize: '14px' }}>Session UUID: {s.id}</p>
                      {s.submitted_by && <p style={{ fontSize: '14px', marginTop: '4px' }}>Finalized By: {s.submitted_by} at {new Date(s.submitted_at).toLocaleString()}</p>}
                    </div>
                  </div>
                </td>
              </tr>
            </React.Fragment>
          ))}
          {sessions.length === 0 && (
            <tr>
              <td colSpan="3" style={{ padding: 0 }}>
                <div className="empty-state">No records yet</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
