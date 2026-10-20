// src/components/admin/AdminProtectedRoute.js
//
// Gate for all admin pages. On mount it calls GET /adminhub/me (the admin
// instance carries the adminToken cookie). While the check is pending it shows a
// minimal "Checking…" state; on success it renders its children; on failure it
// redirects to the admin login. Uses LOCAL component state only — admin auth is
// completely separate from the user AuthContext.

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import adminApi from './adminApi';

const AdminProtectedRoute = ({ children }) => {
  // 'pending' | 'ok' | 'fail'
  const [authState, setAuthState] = useState('pending');

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const { data } = await adminApi.get('/adminhub/me');
        if (!active) return;
        setAuthState(data.status === 'Success' ? 'ok' : 'fail');
      } catch (err) {
        // 401 (no interceptor on adminApi) or any error -> not authenticated
        if (active) setAuthState('fail');
      }
    };

    checkAuth();
    return () => {
      active = false;
    };
  }, []);

  if (authState === 'pending') {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Checking…</div>;
  }

  if (authState === 'fail') {
    return <Navigate to="/adminhub/matrimony/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
