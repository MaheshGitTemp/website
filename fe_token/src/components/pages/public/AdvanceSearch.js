

// src/components/pages/public/AdvanceSearch.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Profiles from '../../templates/ImagesLoader';
import { fetchUserDetails } from '../../../services/userService';

const AdvanceSearch = () => {
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanId = searchId.trim().replace(/^MAT/i, '').trim();

    if (!cleanId) {
      setErrorMsg('Please enter a MAT ID to search.');
      return;
    }
    if (isNaN(cleanId)) {
      setErrorMsg('Please enter a valid numeric MAT ID. Example: MAT123 or 123');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchUserDetails(cleanId);
      if (res.data && res.data.uid) {
        navigate(`/profiledetails/${cleanId}`);
      } else {
        setErrorMsg(`No profile found for MAT${cleanId}. Please check the ID and try again.`);
      }
    } catch {
      setErrorMsg(`No profile found for MAT${cleanId}. Please check the ID and try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Page Heading */}
      <div
        className="inner-heading"
        style={{ backgroundImage: `url(${Profiles.titlebg})` }}
      >
        <div className="container">
          <h3>Advanced Search</h3>
        </div>
      </div>

      <div className="inner-content">
        <div className="container">

          {/* ── Search Card ────────────────────────────────────────────── */}
          <div style={{
            maxWidth: '680px',
            margin: '40px auto',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            overflow: 'hidden'
          }}>

            {/* Card Header */}
            <div style={{
              background: 'linear-gradient(135deg, #a84040 0%, #8B0000 100%)',
              padding: '28px 32px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <i className="fas fa-search" style={{ color: '#fff', fontSize: '20px' }}></i>
                </div>
                <div>
                  <h4 style={{ color: '#fff', margin: 0, fontSize: '20px', fontWeight: '700' }}>
                    Search by MAT ID
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '13px' }}>
                    Find any profile instantly using their unique matrimony ID
                  </p>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '32px' }}>
              <form onSubmit={handleSearch}>

                {/* Label */}
                <label style={{
                  display: 'block',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#444',
                  marginBottom: '10px'
                }}>
                  Enter MAT ID
                  <span style={{ color: '#f44336', marginLeft: '4px' }}>*</span>
                </label>

                {/* Input + Button Row */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'stretch'
                }}>
                  {/* Input wrapper with MAT prefix */}
                  <div style={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {/* MAT prefix badge */}
                    <div style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      bottom: '0',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '14px',
                      paddingRight: '10px',
                      borderRight: '1px solid #dee2e6',
                      background: 'transparent',
                      pointerEvents: 'none',
                      zIndex: 2
                    }}>
                      <span style={{
                        color: '#a84040',
                        fontWeight: '800',
                        fontSize: '15px',
                        letterSpacing: '0.5px'
                      }}>
                        MAT
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="e.g.  123"
                      value={searchId}
                      onChange={(e) => {
                        setSearchId(e.target.value);
                        setErrorMsg('');
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
                      style={{
                        width: '100%',
                        height: '50px',
                        paddingLeft: '68px',
                        paddingRight: '16px',
                        fontSize: '16px',
                        fontWeight: '600',
                        letterSpacing: '1px',
                        border: errorMsg
                          ? '2px solid #f44336'
                          : '2px solid #dee2e6',
                        borderRadius: '8px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        color: '#333'
                      }}
                      onFocus={e => {
                        if (!errorMsg) e.target.style.borderColor = '#a84040';
                      }}
                      onBlur={e => {
                        if (!errorMsg) e.target.style.borderColor = '#dee2e6';
                      }}
                    />
                  </div>

                  {/* Search Button — same height as input */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      height: '50px',
                      padding: '0 28px',
                      background: loading
                        ? '#e0e0e0'
                        : 'linear-gradient(135deg, #a84040 0%, #8B0000 100%)',
                      color: loading ? '#999' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap',
                      transition: 'opacity 0.2s',
                      flexShrink: 0
                    }}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Searching...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search"></i>
                        Search
                      </>
                    )}
                  </button>
                </div>

                {/* Helper text */}
                <p style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#999',
                  marginBottom: 0
                }}>
                  You can type <strong>123</strong> or <strong>MAT123</strong> — both work
                </p>

                {/* Error Message */}
                {errorMsg && (
                  <div style={{
                    marginTop: '16px',
                    background: '#fdecea',
                    border: '1px solid #f44336',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#c62828',
                    fontSize: '13px'
                  }}>
                    <i className="fas fa-times-circle" style={{ fontSize: '16px', flexShrink: 0 }}></i>
                    {errorMsg}
                  </div>
                )}

              </form>

              {/* Divider */}
              <div style={{
                margin: '28px 0',
                borderTop: '1px solid #f0f0f0'
              }} />

              {/* Tips section */}
              <div>
                <p style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: '12px'
                }}>
                  How to find a MAT ID
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { icon: 'fa-id-card',  color: '#a84040', text: 'MAT ID is shown on every profile page e.g. MAT144' },
                    { icon: 'fa-share-alt', color: '#8B0000', text: 'Ask the person to share their MAT ID from their dashboard' },
                    { icon: 'fa-bell',      color: '#FF9800', text: 'MAT ID appears in your proposal and notification history' }
                  ].map((tip, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      padding: '10px 14px'
                    }}>
                      <div style={{
                        width: '32px', height: '32px',
                        borderRadius: '50%',
                        background: tip.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <i className={`fas ${tip.icon}`} style={{ color: '#fff', fontSize: '13px' }}></i>
                      </div>
                      <span style={{ fontSize: '13px', color: '#555' }}>{tip.text}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AdvanceSearch;
