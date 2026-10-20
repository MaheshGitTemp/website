// src/components/admin/AdminPhotos.js
//
// Photo-review grid. Shows MAT ID, owner name, the image (rendered via the
// shared imageUrl() helper so admin and user image rendering never drift), and a
// review-status dropdown + Update (POST /adminhub/photos/status {id, status}).
// Search by MAT id; pagination driven by `total`.
//
// The initial search can be seeded from the ?search= query param (the Users page
// links here with ?search=MAT<uid>).
//
// Response shape (from FEAT-001): data:{rows,total,page,limit}; each row has
// id, matId, uid, name, imagepath, imagepath_thumb, imagepath_medium, isprofile, status.

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminApi from './adminApi';
import { imageUrl } from '../../utils/imageUrl';

const PHOTO_STATUSES = ['approved', 'rejected', 'pending'];
const LIMIT = 24;

const btn = (bg) => ({ padding: '0.35rem 0.6rem', background: bg, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' });

const AdminPhotos = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusDraft, setStatusDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.get('/adminhub/photos', {
        params: { page, limit: LIMIT, search },
      });
      if (data.status === 'Success') {
        setRows(data.data.rows || []);
        setTotal(data.data.total || 0);
      } else {
        setError(data.result || 'Failed to load photos.');
      }
    } catch (err) {
      setError('Failed to load photos.');
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

  const handleUpdate = async (id) => {
    const status = statusDraft[id];
    if (!status) return;
    try {
      const { data } = await adminApi.post('/adminhub/photos/status', { id, status });
      if (data.status === 'Success') {
        load();
      } else {
        alert(data.result || 'Review status update failed.');
      }
    } catch (err) {
      alert('Review status update failed.');
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, fontSize: '1.4rem' }}>Photos</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Search by MAT id"
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

      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div>No photos found.</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {rows.map((g) => (
            <div key={g.id} style={{ width: 220, background: '#fff', borderRadius: 6, padding: '0.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', boxSizing: 'border-box' }}>
              <div style={{ width: '100%', height: 180, background: '#eef1f5', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={imageUrl(g.imagepath)}
                  alt={g.matId || `MAT${g.uid}`}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                <div><strong>{g.matId || `MAT${g.uid}`}</strong>{g.isprofile ? ' • profile' : ''}</div>
                <div style={{ color: '#52606d' }}>{g.name}</div>
                <div style={{ color: '#7b8794' }}>Status: {g.status}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginTop: '0.5rem' }}>
                <select
                  value={statusDraft[g.id] ?? g.status ?? 'pending'}
                  onChange={(e) => setStatusDraft((d) => ({ ...d, [g.id]: e.target.value }))}
                  style={{ padding: '0.25rem', flex: 1 }}
                >
                  {PHOTO_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button type="button" onClick={() => handleUpdate(g.id)} style={btn('#3e4c59')}>Update</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={btn(page <= 1 ? '#cbd2d9' : '#1f2933')}>Prev</button>
        <span style={{ fontSize: '0.85rem' }}>Page {page} of {totalPages} ({total} total)</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={btn(page >= totalPages ? '#cbd2d9' : '#1f2933')}>Next</button>
      </div>
    </div>
  );
};

export default AdminPhotos;
