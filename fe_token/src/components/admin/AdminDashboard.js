// src/components/admin/AdminDashboard.js
//
// Four stat-card widgets (Total Profiles, Pending Users Approval, Pending Photo
// Approval, Flagged Senders) plus the four accompanying lists, all fed by a
// single GET /adminhub/dashboard call. The pending-approval cards are the
// "main thing" the user asked for (message 12).
//
// Response shape (from FEAT-001):
//   data: {
//     stats: { totalUsers, pendingProfiles, pendingPhotos, flaggedSenders },
//     pendingProfilesList, pendingPhotosList, recentUsersList, flaggedSendersList
//   }

import React, { useEffect, useState } from 'react';
import adminApi from './adminApi';

const cardStyle = (accent) => ({
  flex: '1 1 200px',
  background: '#fff',
  borderLeft: `4px solid ${accent}`,
  borderRadius: 6,
  padding: '1rem 1.25rem',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
});

const panelStyle = {
  flex: '1 1 360px',
  background: '#fff',
  borderRadius: 6,
  padding: '1rem 1.25rem',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  boxSizing: 'border-box',
};

const thtd = { textAlign: 'left', padding: '0.4rem 0.5rem', borderBottom: '1px solid #e4e7eb', fontSize: '0.85rem' };

const ListPanel = ({ title, rows, columns, emptyText }) => (
  <div style={panelStyle}>
    <h3 style={{ marginTop: 0, fontSize: '1rem' }}>{title}</h3>
    {(!rows || rows.length === 0) ? (
      <p style={{ color: '#7b8794', fontSize: '0.9rem' }}>{emptyText}</p>
    ) : (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{columns.map((c) => <th key={c.key} style={thtd}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => <td key={c.key} style={thtd}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const matOf = (uid) => (uid != null ? `MAT${uid}` : '');

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await adminApi.get('/adminhub/dashboard');
        if (!active) return;
        if (res.data.status === 'Success') {
          setData(res.data.data);
        } else {
          setError(res.data.result || 'Failed to load dashboard.');
        }
      } catch (err) {
        if (active) setError('Failed to load dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  if (loading) return <div>Loading dashboard…</div>;
  if (error) return <div style={{ color: '#9b1c1c' }}>{error}</div>;
  if (!data) return null;

  const stats = data.stats || {};

  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: '1.4rem' }}>Dashboard</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={cardStyle('#3e4c59')}>
          <div style={{ fontSize: '0.85rem', color: '#7b8794' }}>Total Profiles</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.totalUsers ?? 0}</div>
        </div>
        <div style={cardStyle('#f0b429')}>
          <div style={{ fontSize: '0.85rem', color: '#7b8794' }}>Pending Users Approval</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.pendingProfiles ?? 0}</div>
        </div>
        <div style={cardStyle('#2bb0ed')}>
          <div style={{ fontSize: '0.85rem', color: '#7b8794' }}>Pending Photo Approval</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.pendingPhotos ?? 0}</div>
        </div>
        <div style={cardStyle('#e12d39')}>
          <div style={{ fontSize: '0.85rem', color: '#7b8794' }}>Flagged Senders</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.flaggedSenders ?? 0}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <ListPanel
          title="Recent Profiles"
          rows={data.recentUsersList}
          emptyText="No profiles."
          columns={[
            { key: 'matId', label: 'MAT ID', render: (r) => r.matId || matOf(r.uid) },
            { key: 'name', label: 'Name' },
            { key: 'status', label: 'Status' },
          ]}
        />
        <ListPanel
          title="Profiles Waiting for Approval"
          rows={data.pendingProfilesList}
          emptyText="No profiles awaiting approval."
          columns={[
            { key: 'matId', label: 'MAT ID', render: (r) => r.matId || matOf(r.uid) },
            { key: 'name', label: 'Name' },
            { key: 'uemail', label: 'Email' },
          ]}
        />
        <ListPanel
          title="Photos Waiting for Review"
          rows={data.pendingPhotosList}
          emptyText="No photos awaiting review."
          columns={[
            { key: 'matId', label: 'MAT ID', render: (r) => r.matId || matOf(r.uid) },
            { key: 'name', label: 'Name' },
            { key: 'status', label: 'Status' },
          ]}
        />
        <ListPanel
          title="Flagged Senders"
          rows={data.flaggedSendersList}
          emptyText="No flagged senders."
          columns={[
            { key: 'sender_mat', label: 'Sender', render: (r) => r.sender_mat || matOf(r.sender_id) },
            { key: 'recipient_mat', label: 'Recipient', render: (r) => r.recipient_mat || matOf(r.receiver_id) },
            { key: 'unanswered_count', label: 'Unanswered' },
          ]}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
