// src/components/admin/AdminUsers.js
//
// Users management table. Columns: MAT ID (button -> shadow login), Name, Email,
// Phone, Photos link, Account Status dropdown + Update, Profile Approval
// dropdown + Update, Delete (confirm). Search by MAT id or name; pagination
// driven by `total`.
//
// Shadow login: POST /adminhub/impersonate {uid} -> {token}; open a new tab to
// /impersonate?token=<token>, which exchanges the one-time token for a real user
// session and lands on /profiles.
//
// Response shape (from FEAT-001): data:{rows,total,page,limit}; each row has
// matId, uid, name, uemail, uphone, status, profileStatus, photos_count.

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from './adminApi';

const ACCOUNT_STATUSES = ['Pending', 'Active', 'Closed', 'Blocked'];
const PROFILE_STATUSES = ['pending', 'approved', 'rejected'];
const LIMIT = 20;

const thtd = { textAlign: 'left', padding: '0.5rem 0.6rem', borderBottom: '1px solid #e4e7eb', fontSize: '0.85rem' };
const btn = (bg) => ({ padding: '0.35rem 0.6rem', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' });

const AdminUsers = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // per-row pending dropdown selections
  const [statusDraft, setStatusDraft] = useState({});
  const [profileDraft, setProfileDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.get('/adminhub/users', {
        params: { page, limit: LIMIT, search },
      });
      if (data.status === 'Success') {
        setRows(data.data.rows || []);
        setTotal(data.data.total || 0);
      } else {
        setError(data.result || 'Failed to load users.');
      }
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleShadowLogin = async (uid) => {
    try {
      const { data } = await adminApi.post('/adminhub/impersonate', { uid });
      if (data.status === 'Success' && data.data?.token) {
        window.open(`${window.location.origin}/impersonate?token=${data.data.token}`, '_blank');
      } else {
        alert(data.result || 'Could not start shadow login.');
      }
    } catch (err) {
      alert('Could not start shadow login.');
    }
  };

  const handleStatusUpdate = async (uid) => {
    const status = statusDraft[uid];
    if (!status) return;
    try {
      const { data } = await adminApi.post('/adminhub/users/status', { uid, status });
      if (data.status === 'Success') {
        load();
      } else {
        alert(data.result || 'Status update failed.');
      }
    } catch (err) {
      alert('Status update failed.');
    }
  };

  const handleProfileUpdate = async (uid) => {
    const profile_status = profileDraft[uid];
    if (!profile_status) return;
    try {
      const { data } = await adminApi.post('/adminhub/users/profilestatus', { uid, profile_status });
      if (data.status === 'Success') {
        load();
      } else {
        alert(data.result || 'Profile approval update failed.');
      }
    } catch (err) {
      alert('Profile approval update failed.');
    }
  };

  const handleDelete = async (uid, matId) => {
    if (!window.confirm(`Delete ${matId || 'MAT' + uid}? This removes the user and ALL their photos, conversations and data. This cannot be undone.`)) {
      return;
    }
    try {
      const { data } = await adminApi.delete(`/adminhub/users/${uid}`);
      if (data.status === 'Success') {
        load();
      } else {
        alert(data.result || 'Delete failed.');
      }
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const goToPhotos = (uid) => {
    navigate(`/adminhub/matrimony/photos?search=MAT${uid}`);
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: '1.4rem' }}>Users</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Search by MAT id or name"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #cbd2d9', borderRadius: 4, width: 280 }}
        />
        <button type="submit" style={btn('#1f2933')}>Search</button>
        {search && (
          <button
            type="button"
            style={btn('#7b8794')}
            onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
          >
            Clear
          </button>
        )}
      </form>

      {error && <div style={{ color: '#9b1c1c', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={thtd}>MAT ID</th>
              <th style={thtd}>Name</th>
              <th style={thtd}>Email</th>
              <th style={thtd}>Phone</th>
              <th style={thtd}>Photos</th>
              <th style={thtd}>Account Status</th>
              <th style={thtd}>Profile Approval</th>
              <th style={thtd}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td style={thtd} colSpan={8}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td style={thtd} colSpan={8}>No users found.</td></tr>
            ) : (
              rows.map((u) => (
                <tr key={u.uid}>
                  <td style={thtd}>
                    <button
                      type="button"
                      title="Shadow login as this user (opens a new tab)"
                      onClick={() => handleShadowLogin(u.uid)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.85rem' }}
                    >
                      {u.matId || `MAT${u.uid}`}
                    </button>
                  </td>
                  <td style={thtd}>{u.name}</td>
                  <td style={thtd}>{u.uemail}</td>
                  <td style={thtd}>{u.uphone}</td>
                  <td style={thtd}>
                    <button
                      type="button"
                      onClick={() => goToPhotos(u.uid)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.85rem' }}
                    >
                      {u.photos_count ?? 0} photos
                    </button>
                  </td>
                  <td style={thtd}>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <select
                        value={statusDraft[u.uid] ?? u.status ?? 'Active'}
                        onChange={(e) => setStatusDraft((d) => ({ ...d, [u.uid]: e.target.value }))}
                        style={{ padding: '0.25rem' }}
                      >
                        {ACCOUNT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button type="button" onClick={() => handleStatusUpdate(u.uid)} style={btn('#3e4c59')}>Update</button>
                    </div>
                  </td>
                  <td style={thtd}>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <select
                        value={profileDraft[u.uid] ?? u.profileStatus ?? 'pending'}
                        onChange={(e) => setProfileDraft((d) => ({ ...d, [u.uid]: e.target.value }))}
                        style={{ padding: '0.25rem' }}
                      >
                        {PROFILE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button type="button" onClick={() => handleProfileUpdate(u.uid)} style={btn('#3e4c59')}>Update</button>
                    </div>
                  </td>
                  <td style={thtd}>
                    <button type="button" onClick={() => handleDelete(u.uid, u.matId)} style={btn('#e12d39')}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={btn(page <= 1 ? '#cbd2d9' : '#1f2933')}>Prev</button>
        <span style={{ fontSize: '0.85rem' }}>Page {page} of {totalPages} ({total} total)</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={btn(page >= totalPages ? '#cbd2d9' : '#1f2933')}>Next</button>
      </div>
    </div>
  );
};

export default AdminUsers;
