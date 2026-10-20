// src/components/admin/AdminMessagesList.js
//
// Flagged-senders table: a sender who has sent more than 10 consecutive
// unanswered messages to the same recipient (any reply resets the streak).
// Columns: Sender (MAT/name), Recipient (MAT/name), Unanswered Count, Last
// Message Time. Pagination driven by `total`.
//
// Response shape (from FEAT-001): data:{rows,total,page,limit}; each row has
// sender_id, sender_mat, sender_name, receiver_id, recipient_mat,
// recipient_name, unanswered_count, last_message_time.

import React, { useCallback, useEffect, useState } from 'react';
import adminApi from './adminApi';

const LIMIT = 20;

const thtd = { textAlign: 'left', padding: '0.5rem 0.6rem', borderBottom: '1px solid #e4e7eb', fontSize: '0.85rem' };
const btn = (bg) => ({ padding: '0.35rem 0.6rem', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' });

const fmtTime = (t) => {
  if (!t) return '';
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? String(t) : d.toLocaleString();
};

const AdminMessagesList = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.get('/adminhub/messageslist', {
        params: { page, limit: LIMIT },
      });
      if (data.status === 'Success') {
        setRows(data.data.rows || []);
        setTotal(data.data.total || 0);
      } else {
        setError(data.result || 'Failed to load flagged senders.');
      }
    } catch (err) {
      setError('Failed to load flagged senders.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: '1.4rem' }}>Flagged Senders</h1>
      <p style={{ color: '#52606d', fontSize: '0.9rem', marginTop: 0 }}>
        Senders with more than 10 consecutive unanswered messages to the same recipient.
      </p>

      {error && <div style={{ color: '#9b1c1c', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={thtd}>Sender</th>
              <th style={thtd}>Recipient</th>
              <th style={thtd}>Unanswered Count</th>
              <th style={thtd}>Last Message Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td style={thtd} colSpan={4}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td style={thtd} colSpan={4}>No flagged senders.</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.sender_id}-${r.receiver_id}-${i}`}>
                  <td style={thtd}>
                    <div><strong>{r.sender_mat || `MAT${r.sender_id}`}</strong></div>
                    <div style={{ color: '#52606d' }}>{r.sender_name}</div>
                  </td>
                  <td style={thtd}>
                    <div><strong>{r.recipient_mat || `MAT${r.receiver_id}`}</strong></div>
                    <div style={{ color: '#52606d' }}>{r.recipient_name}</div>
                  </td>
                  <td style={thtd}>{r.unanswered_count}</td>
                  <td style={thtd}>{fmtTime(r.last_message_time)}</td>
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

export default AdminMessagesList;
