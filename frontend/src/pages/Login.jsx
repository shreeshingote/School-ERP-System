import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5001/api';

export default function Login() {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'teacher' | 'student'
  const [identifier, setIdentifier] = useState('admin@school.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Quick-fill credentials when switching tabs
  const handleTabChange = (role) => {
    setActiveTab(role);
    setError('');
    if (role === 'admin') {
      setIdentifier('admin@school.com');
      setPassword('admin123');
    } else if (role === 'teacher') {
      setIdentifier('EMP1001');
      setPassword('password123');
    } else if (role === 'student') {
      setIdentifier('STU1001');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier,
        password,
      });

      const { token, user } = res.data;

      // Save user session
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to the appropriate portal based on user role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (user.role === 'student') {
        navigate('/student/dashboard');
      } else {
        setError('Unknown user role detected.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🏫 CAMPUS AUTOMATION SYSTEM</h2>
        <p style={styles.subtitle}>Select your portal to log in</p>

        {/* Portal Selection Tabs */}
        <div style={styles.tabContainer}>
          <button
            type="button"
            style={{ ...styles.tab, ...(activeTab === 'admin' ? styles.activeTab : {}) }}
            onClick={() => handleTabChange('admin')}
          >
            🔑 Admin
          </button>
          <button
            type="button"
            style={{ ...styles.tab, ...(activeTab === 'teacher' ? styles.activeTab : {}) }}
            onClick={() => handleTabChange('teacher')}
          >
            👨‍🏫 Faculty
          </button>
          <button
            type="button"
            style={{ ...styles.tab, ...(activeTab === 'student' ? styles.activeTab : {}) }}
            onClick={() => handleTabChange('student')}
          >
            🎓 Student
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            {activeTab === 'admin' ? 'Email Address' : 'User ID (EMP... / STU...) or Email'}
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={activeTab === 'teacher' ? 'EMP1001' : activeTab === 'student' ? 'STU1001' : 'admin@school.com'}
            required
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Logging in...' : `Login to ${activeTab.toUpperCase()} Portal`}
          </button>
        </form>

        {/* Quick Credentials Info Box */}
        <div style={styles.infoBox}>
          <strong>Demo Credential Loaded:</strong>
          <br />
          <code>ID/Email: {identifier}</code> | <code>Pass: {password}</code>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff' },
  card: { width: '100%', maxWidth: '420px', padding: '2rem', backgroundColor: '#1e293b', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' },
  title: { textAlign: 'center', fontSize: '1.4rem', color: '#38bdf8', marginBottom: '0.25rem' },
  subtitle: { textAlign: 'center', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem' },
  tabContainer: { display: 'flex', gap: '8px', marginBottom: '1.5rem', backgroundColor: '#0f172a', padding: '4px', borderRadius: '8px' },
  tab: { flex: 1, padding: '8px', border: 'none', borderRadius: '6px', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' },
  activeTab: { backgroundColor: '#0284c7', color: '#fff', fontWeight: 'bold' },
  errorBox: { padding: '10px', backgroundColor: '#7f1d1d', color: '#fecaca', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '0.8rem', color: '#cbd5e1' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' },
  submitBtn: { padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#0284c7', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  infoBox: { marginTop: '1.5rem', padding: '10px', backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }
};