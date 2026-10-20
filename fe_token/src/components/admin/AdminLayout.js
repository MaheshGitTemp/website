// src/components/admin/AdminLayout.js
//
// Minimal admin chrome: a left sidebar with navigation links and a Logout
// button, plus a content area rendered via <Outlet/>. It deliberately does NOT
// import the public Header/Footer — the admin panel is a separate shell.

import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import adminApi from './adminApi';

const sidebarStyle = {
  width: 220,
  minHeight: '100vh',
  background: '#1f2933',
  color: '#fff',
  padding: '1rem',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
};

const linkStyle = ({ isActive }) => ({
  display: 'block',
  padding: '0.6rem 0.75rem',
  marginBottom: '0.25rem',
  borderRadius: 4,
  color: isActive ? '#1f2933' : '#cbd2d9',
  background: isActive ? '#fff' : 'transparent',
  textDecoration: 'none',
  fontWeight: isActive ? 600 : 400,
});

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await adminApi.post('/adminhub/logout');
    } catch (err) {
      // Logout is best-effort; clear the session client-side regardless.
      console.error('Admin logout error:', err);
    }
    navigate('/adminhub/matrimony/login', { replace: true });
  };

  return (
    <div style={{ display: 'flex', fontFamily: 'sans-serif' }}>
      <aside style={sidebarStyle}>
        <h2 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '1.25rem' }}>Admin Panel</h2>
        <nav style={{ flex: 1 }}>
          <NavLink to="/adminhub/matrimony/dashboard" style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/adminhub/matrimony/users" style={linkStyle}>Users</NavLink>
          <NavLink to="/adminhub/matrimony/photos" style={linkStyle}>Photos</NavLink>
          <NavLink to="/adminhub/matrimony/messageslist" style={linkStyle}>Messages List</NavLink>
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            marginTop: '1rem',
            padding: '0.6rem',
            background: '#e12d39',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </aside>
      <main style={{ flex: 1, padding: '1.5rem', background: '#f5f7fa', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
