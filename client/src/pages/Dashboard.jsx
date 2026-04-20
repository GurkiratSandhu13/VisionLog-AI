import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, sessions: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, historyRes] = await Promise.all([
          api.get('/users/'),
          api.get('/attendance/history')
        ]);
        setStats({
          users: usersRes.data.length,
          sessions: historyRes.data.length,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px' }}>
      <div className="gap-between-sections flex-row" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <h1 className="dashboard-heading">Metrics Overview</h1>
          <p className="dashboard-subheading">AI-Powered Attendance Monitoring</p>
        </div>
      </div>

      {stats.users === 0 && stats.sessions === 0 ? (
        <div className="empty-state">No records yet</div>
      ) : (
        <div className="cards-grid" style={{ marginBottom: '24px' }}>
          <div className="card text-center hover-border">
            <p className="stat-label">Total Registered</p>
            <p className="stat-number">{stats.users}</p>
          </div>
          <div className="card text-center hover-border">
            <p className="stat-label">Total Sessions</p>
            <p className="stat-number">{stats.sessions}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
        <Link to="/register" className="btn-ghost">Register User</Link>
        <Link to="/monitor" className="btn-primary">Start Session</Link>
      </div>
    </div>
  );
}
