// src/components/admin/AdminLogin.js
//
// Admin login: two fields (identifier, password) -> POST /adminhub/login.
// On Success navigate to the dashboard. On Failure show the backend's message
// inline. This mirrors the user-login lesson (messages 5/6): a wrong password
// MUST surface a visible error and must NOT appear to log in. The backend
// returns HTTP 200 with {status:'Failure'} for wrong credentials (no interceptor
// swallows it), so we branch on data.status rather than on an HTTP error.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from './adminApi';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Enter your username/email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await adminApi.post('/adminhub/login', {
        identifier: identifier.trim(),
        password,
      });

      if (data.status === 'Success') {
        navigate('/adminhub/matrimony/dashboard', { replace: true });
      } else {
        // Wrong credentials: show the error, do NOT navigate.
        setError(data.result || 'Invalid credentials.');
      }
    } catch (err) {
      // Unexpected server/network error (e.g. 500).
      setError(err.response?.data?.result || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f7fa',
        fontFamily: 'sans-serif',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 340,
          background: '#fff',
          padding: '2rem',
          borderRadius: 8,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.25rem' }}>Admin Login</h2>

        {error && (
          <div
            role="alert"
            style={{
              background: '#fde8e8',
              color: '#9b1c1c',
              padding: '0.6rem 0.75rem',
              borderRadius: 4,
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
          Username or Email
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          style={{
            width: '100%',
            padding: '0.6rem',
            marginBottom: '1rem',
            boxSizing: 'border-box',
            border: '1px solid #cbd2d9',
            borderRadius: 4,
          }}
        />

        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          style={{
            width: '100%',
            padding: '0.6rem',
            marginBottom: '1.25rem',
            boxSizing: 'border-box',
            border: '1px solid #cbd2d9',
            borderRadius: 4,
          }}
        />

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '0.7rem',
            background: submitting ? '#7b8794' : '#1f2933',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: submitting ? 'default' : 'pointer',
            fontSize: '1rem',
          }}
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
