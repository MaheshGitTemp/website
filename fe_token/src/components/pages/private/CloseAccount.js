// src/components/pages/private/CloseAccount.js
import React, { useState, useContext } from 'react';
import Profiles from '../../templates/ImagesLoader';
import Sidebar from './templates/Sidebar';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';
import { closeAccount } from '../../../services/userService';
import { useToast } from '../../../components/hooks/ToastContext';
const CloseAccount = () => {
  const navigate    = useNavigate();
  const { showToast } = useToast();
 
  const { logout }  = useContext(AuthContext);

  // ── State ─────────────────────────────────────────────────────────────────
  const [step,         setStep]         = useState(1); // 1=warning, 2=confirm, 3=done
  const [loading,      setLoading]      = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [typedConfirm, setTypedConfirm] = useState('');

  // User must type "CLOSE" to confirm
  const CONFIRM_WORD = 'CLOSE';

  // ── Handle close account ──────────────────────────────────────────────────
  const handleCloseAccount = async () => {
    if (typedConfirm !== CONFIRM_WORD) {
      setErrorMsg(`Please type "${CONFIRM_WORD}" to confirm.`);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await closeAccount();

      if (res.data.status === 'Success') {
        showToast({
  title:       'Account Closing',
  description: 'Your account is being closed. You will be logged out shortly.',
  type:        'warning',
  duration:    4000
});
        setStep(3); // show success screen
        // Clear local state + cookies via logout
        await logout();
      } else {
        setErrorMsg(res.data.result || 'Failed to close account. Please try again.');
      }
    } catch (err) {
      showToast({
  title:       'Account Closing',
  description: 'Your account is being closed. You will be logged out shortly.',
  type:        'warning',
  duration:    4000
});
      console.error('closeAccount error:', err);
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <>
      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>Close Account</h3>
        </div>
      </div>

      <div className="inner-content">
        <div className="container">
          <div className="profile-Wrap">
            <div className="row">
              <Sidebar />

              <div className="col-lg-8 col-md-8">
                <div className="translateY-60">
                  <div className="add-listing-box mrg-bot-25 padd-bot-30 padd-top-25">

                    {/* ── STEP 1: Warning ─────────────────────────────────── */}
                    {step === 1 && (
                      <>
                        <div className="listing-box-header">
                          <h3 style={{ color: '#c62828' }}>
                            <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                            Close Your Account
                          </h3>
                        </div>

                        <div style={{ padding: '20px' }}>
                          {/* Warning banner */}
                          <div style={{
                            background: '#fff8e1', border: '2px solid #FFC107',
                            borderRadius: '8px', padding: '16px 20px', marginBottom: '24px'
                          }}>
                            <h5 style={{ color: '#f57f17', marginBottom: '8px' }}>
                              ⚠️ Before you close your account, please read:
                            </h5>
                            <ul style={{ color: '#666', fontSize: '14px', paddingLeft: '20px', margin: 0 }}>
                              <li style={{ marginBottom: '6px' }}>Your profile will be permanently deactivated</li>
                              <li style={{ marginBottom: '6px' }}>You will not be able to login with this account</li>
                              <li style={{ marginBottom: '6px' }}>All your proposals and messages will be hidden</li>
                              <li style={{ marginBottom: '6px' }}>Your MAT ID will be reserved and not reused</li>
                              <li style={{ marginBottom: '6px' }}>To reactivate, you must contact support</li>
                            </ul>
                          </div>

                          {/* What happens */}
                          <div style={{ marginBottom: '24px' }}>
                            <h5 style={{ color: '#333', marginBottom: '12px' }}>What happens when you close:</h5>
                            <div className="row">
                              {[
                                { icon: 'fa-user-slash',    color: '#f44336', label: 'Profile Hidden',     desc: 'No longer visible in search' },
                                { icon: 'fa-lock',          color: '#FF9800', label: 'Account Locked',    desc: 'Cannot login anymore'         },
                                { icon: 'fa-heart-broken',  color: '#E91E63', label: 'Proposals Removed', desc: 'All proposals deactivated'    },
                                { icon: 'fa-envelope-open', color: '#9C27B0', label: 'Messages Hidden',   desc: 'Chat history inaccessible'    }
                              ].map((item, i) => (
                                <div key={i} className="col-md-6" style={{ marginBottom: '12px' }}>
                                  <div style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    background: '#f8f9fa', borderRadius: '8px', padding: '12px'
                                  }}>
                                    <div style={{
                                      width: '40px', height: '40px', borderRadius: '50%',
                                      background: item.color, display: 'flex',
                                      alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                      <i className={`fas ${item.icon}`} style={{ color: '#fff', fontSize: '16px' }}></i>
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#333' }}>{item.label}</div>
                                      <div style={{ fontSize: '12px', color: '#888' }}>{item.desc}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => navigate('/dashboard')}
                              className="btn"
                              style={{ padding: '10px 24px', fontSize: '14px' }}
                            >
                              <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>
                              Keep My Account
                            </button>
                            <button
                              onClick={() => setStep(2)}
                              style={{
                                padding: '10px 24px', fontSize: '14px',
                                background: '#c62828', color: '#fff',
                                border: 'none', borderRadius: '4px', cursor: 'pointer'
                              }}
                            >
                              <i className="fas fa-times-circle" style={{ marginRight: '6px' }}></i>
                              I Want to Close My Account
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── STEP 2: Final Confirmation ───────────────────────── */}
                    {step === 2 && (
                      <>
                        <div className="listing-box-header">
                          <h3 style={{ color: '#c62828' }}>
                            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                            Final Confirmation
                          </h3>
                        </div>

                        <div style={{ padding: '20px' }}>
                          {/* Danger banner */}
                          <div style={{
                            background: '#fdecea', border: '2px solid #f44336',
                            borderRadius: '8px', padding: '16px 20px', marginBottom: '24px',
                            textAlign: 'center'
                          }}>
                            <i className="fas fa-exclamation-triangle" style={{ fontSize: '32px', color: '#f44336', display: 'block', marginBottom: '8px' }}></i>
                            <h5 style={{ color: '#c62828', margin: '0 0 6px' }}>
                              This action cannot be undone!
                            </h5>
                            <p style={{ color: '#c62828', margin: 0, fontSize: '14px' }}>
                              Your account will be permanently closed. You will be logged out immediately.
                            </p>
                          </div>

                          {/* Type to confirm */}
                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontWeight: '600', fontSize: '14px', color: '#333', display: 'block', marginBottom: '8px' }}>
                              Type <strong style={{ color: '#c62828' }}>{CONFIRM_WORD}</strong> to confirm account closure:
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder={`Type ${CONFIRM_WORD} here`}
                              value={typedConfirm}
                              onChange={(e) => {
                                setTypedConfirm(e.target.value.toUpperCase());
                                setErrorMsg('');
                              }}
                              style={{
                                border: typedConfirm && typedConfirm !== CONFIRM_WORD
                                  ? '2px solid #f44336'
                                  : typedConfirm === CONFIRM_WORD
                                    ? '2px solid #4CAF50'
                                    : '1px solid #ced4da',
                                fontSize: '16px', letterSpacing: '2px',
                                fontWeight: 'bold', textAlign: 'center'
                              }}
                            />
                            {/* Live feedback */}
                            {typedConfirm && (
                              <span style={{
                                fontSize: '12px', fontWeight: 'bold', marginTop: '4px', display: 'block',
                                color: typedConfirm === CONFIRM_WORD ? '#4CAF50' : '#f44336'
                              }}>
                                {typedConfirm === CONFIRM_WORD
                                  ? '✅ Confirmed — you can now close your account'
                                  : `❌ Please type exactly: ${CONFIRM_WORD}`}
                              </span>
                            )}
                          </div>

                          {/* Error message */}
                          {errorMsg && (
                            <div style={{
                              background: '#fdecea', border: '1px solid #f44336',
                              borderRadius: '6px', padding: '10px 14px',
                              color: '#c62828', marginBottom: '16px', fontSize: '13px'
                            }}>
                              <i className="fas fa-times-circle" style={{ marginRight: '6px' }}></i>
                              {errorMsg}
                            </div>
                          )}

                          {/* Buttons */}
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => { setStep(1); setTypedConfirm(''); setErrorMsg(''); }}
                              className="btn"
                              style={{ padding: '10px 24px', fontSize: '14px' }}
                            >
                              <i className="fas fa-arrow-left" style={{ marginRight: '6px' }}></i>
                              Go Back
                            </button>
                            <button
                              onClick={handleCloseAccount}
                              disabled={loading || typedConfirm !== CONFIRM_WORD}
                              style={{
                                padding: '10px 24px', fontSize: '14px',
                                background: typedConfirm === CONFIRM_WORD ? '#c62828' : '#e0e0e0',
                                color: typedConfirm === CONFIRM_WORD ? '#fff' : '#999',
                                border: 'none', borderRadius: '4px',
                                cursor: typedConfirm === CONFIRM_WORD && !loading ? 'pointer' : 'not-allowed',
                                opacity: loading ? 0.7 : 1
                              }}
                            >
                              {loading ? (
                                <><i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>Closing Account...</>
                              ) : (
                                <><i className="fas fa-times-circle" style={{ marginRight: '6px' }}></i>Close My Account Permanently</>
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── STEP 3: Success / Account Closed ────────────────── */}
                    {step === 3 && (
                      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{
                          width: '80px', height: '80px', borderRadius: '50%',
                          background: '#e6f9ee', margin: '0 auto 20px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <i className="fas fa-check-circle" style={{ fontSize: '40px', color: '#4CAF50' }}></i>
                        </div>
                        <h4 style={{ color: '#2e7d32', marginBottom: '8px' }}>
                          Account Closed Successfully
                        </h4>
                        <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
                          Your account has been closed. We're sorry to see you go.<br />
                          If you change your mind, please contact our support team.
                        </p>
                        <button
                          onClick={() => navigate('/')}
                          className="btn"
                          style={{ padding: '10px 30px' }}
                        >
                          <i className="fas fa-home" style={{ marginRight: '6px' }}></i>
                          Go to Home
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CloseAccount;