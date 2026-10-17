
import React, { useState, useEffect } from 'react';
import Profiles from '../../templates/ImagesLoader';
import Sidebar from './templates/Sidebar';
import { changePassword, getUserContactInfo } from '../../../services/userService';
import { useToast } from '../../../components/hooks/ToastContext';
const ChangePassword = () => {
  const userId = localStorage.getItem('userId');
const { showToast } = useToast();
 
  // ── Form state ────────────────────────────────────────────────────────────
  const [currentPassword,     setCurrentPassword]     = useState('');
  const [newPassword,         setNewPassword]         = useState('');
  const [confirmNewPassword,  setConfirmNewPassword]  = useState('');

  // ── Eye toggle state ──────────────────────────────────────────────────────
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');
  const [errorMsg,     setErrorMsg]     = useState('');
  const [errors,       setErrors]       = useState({});

  // ── User info (read-only display) ─────────────────────────────────────────
  const [userEmail,    setUserEmail]    = useState('');
  const [userPhone,    setUserPhone]    = useState('');

  // ── Password strength ─────────────────────────────────────────────────────
  const [strength,     setStrength]     = useState('');

  // ── Load email + phone for display ───────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const loadContact = async () => {
      try {
        const res = await getUserContactInfo(userId);
        if (res.data.status === 'Success') {
          setUserEmail(res.data.data.uemail || '');
          setUserPhone(res.data.data.uphone || '');
        }
      } catch (err) {
        console.error('Load contact error:', err);
      }
    };
    loadContact();
  }, [userId]);

  // ── Password strength checker ─────────────────────────────────────────────
  const checkStrength = (password) => {
    if (!password) { setStrength(''); return; }
    let score = 0;
    if (password.length >= 6)                              score++;
    if (password.length >= 10)                             score++;
    if (/[A-Z]/.test(password))                            score++;
    if (/[a-z]/.test(password))                            score++;
    if (/[0-9]/.test(password))                            score++;
    if (/[!@#$%^&*()_+\-=\[\]{}]/.test(password))         score++;
    if      (score <= 2) setStrength('weak');
    else if (score <= 4) setStrength('medium');
    else                 setStrength('strong');
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!currentPassword)              errs.currentPassword    = 'Current password is required.';
    if (!newPassword)                  errs.newPassword        = 'New password is required.';
    else if (newPassword.length < 6)   errs.newPassword        = 'Must be at least 6 characters.';
    else if (!/[A-Z]/.test(newPassword)) errs.newPassword      = 'Must contain at least one uppercase letter.';
    else if (!/[0-9]/.test(newPassword)) errs.newPassword      = 'Must contain at least one number.';
    else if (newPassword === currentPassword) errs.newPassword  = 'New password must differ from current.';
    if (!confirmNewPassword)           errs.confirmNewPassword  = 'Please confirm your new password.';
    else if (newPassword !== confirmNewPassword) errs.confirmNewPassword = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.data.status === 'Success') {
        // ✅ Success
showToast({
  title:       'Password Changed',
  description: 'Your password has been updated successfully.',
  type:        'success'
});
        setSuccessMsg('✅ Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setStrength('');
        setErrors({});
        
      } else {
          showToast({
  title:       'Passwords Do Not Match',
  description: 'New password and confirm password must be the same.',
  type:        'warning'
});
        setErrorMsg(res.data.result || 'Failed to update password.');
        // Highlight current password field if wrong
        if (res.data.result?.includes('incorrect')) {
          setErrors({ currentPassword: 'Current password is incorrect.' });
        
        }
      }
    } catch (err) {
       // ❌ Wrong current password
showToast({
  title:       'Incorrect Password',
  description: 'The current password you entered is wrong. Please try again.',
  type:        'error'
});
      console.error('changePassword error:', err);
      setErrorMsg('Something went wrong. Please try again.');
     
    } finally {
      setLoading(false);
      // ❌ Wrong current password
showToast({
  title:       'Incorrect Password',
  description: 'The current password you entered is wrong. Please try again.',
  type:        'error'
});
    }
  };

  // ── Eye icon button ───────────────────────────────────────────────────────
  const EyeBtn = ({ show, toggle }) => (
    <button
      type="button"
      onClick={toggle}
      style={{
        position: 'absolute', right: '12px', top: '50%',
        transform: 'translateY(-50%)',
        background: 'none', border: 'none',
        cursor: 'pointer', color: '#888', zIndex: 10
      }}
    >
      <i className={show ? 'far fa-eye-slash' : 'far fa-eye'}></i>
    </button>
  );

  // ── Strength bar ──────────────────────────────────────────────────────────
  const StrengthBar = () => {
    if (!strength) return null;
    const colors = { weak: '#f44336', medium: '#FFC107', strong: '#4CAF50' };
    const labels = { weak: '⚠ Weak', medium: '👍 Medium', strong: '✅ Strong' };
    return (
      <div style={{ marginTop: '6px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
          {['weak', 'medium', 'strong'].map((level, i) => (
            <div key={i} style={{
              height: '4px', flex: 1, borderRadius: '2px',
              background: (
                strength === 'weak'   && i === 0 ? colors.weak   :
                strength === 'medium' && i <= 1  ? colors.medium :
                strength === 'strong'             ? colors.strong : '#e0e0e0'
              )
            }} />
          ))}
        </div>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: colors[strength] }}>
          {labels[strength]}
        </span>
      </div>
    );
  };

  // ── Input wrapper style ───────────────────────────────────────────────────
  const inputWrap = { position: 'relative', marginBottom: '4px' };
  const inputStyle = (hasError) => ({
    paddingRight: '40px',
    border: hasError ? '2px solid #f44336' : '1px solid #ced4da',
    borderRadius: '4px'
  });
  const errorStyle = { color: '#f44336', fontSize: '12px', marginBottom: '8px', display: 'block' };

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <>
      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>🔒 Change Password</h3>
        </div>
      </div>

      <div className="inner-content">
        <div className="container">
          <div className="profile-Wrap">
            <div className="row">
              <Sidebar />

              <div className="col-lg-8 col-md-8">
                <div className="translateY-60">
                  <div className="add-listing-box add-location mrg-bot-25 padd-bot-30 padd-top-25">

                    <div className="listing-box-header">
                      <i className="fas fa-key" style={{ marginRight: '8px', color: '#a84040' }}></i>
                      <h3>Change Password</h3>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '10px 20px' }}>

                      {/* ── Read-only user info ─────────────────────────── */}
                      <div className="row mrg-r-10 mrg-l-10" style={{ marginBottom: '16px' }}>
                        <div className="col-lg-6">
                          <label style={{ fontWeight: '600', fontSize: '13px', color: '#555' }}>
                            <i className="far fa-envelope" style={{ marginRight: '6px', color: '#a84040' }}></i>
                            Email
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={userEmail}
                            readOnly
                            style={{ background: '#f8f9fa', color: '#666', cursor: 'not-allowed' }}
                          />
                        </div>
                        <div className="col-lg-6">
                          <label style={{ fontWeight: '600', fontSize: '13px', color: '#555' }}>
                            <i className="fas fa-phone" style={{ marginRight: '6px', color: '#a84040' }}></i>
                            Phone
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={userPhone}
                            readOnly
                            style={{ background: '#f8f9fa', color: '#666', cursor: 'not-allowed' }}
                          />
                        </div>
                      </div>

                      <hr style={{ borderColor: '#dee2e6', margin: '16px 0' }} />

                      {/* ── Global success/error messages ───────────────── */}
                      {successMsg && (
                        <div style={{
                          background: '#e6f9ee', border: '1px solid #4CAF50',
                          borderRadius: '6px', padding: '12px 16px',
                          color: '#2e7d32', marginBottom: '16px', fontSize: '14px'
                        }}>
                          {successMsg}
                        </div>
                      )}
                      {errorMsg && (
                        <div style={{
                          background: '#fdecea', border: '1px solid #f44336',
                          borderRadius: '6px', padding: '12px 16px',
                          color: '#c62828', marginBottom: '16px', fontSize: '14px'
                        }}>
                          <i className="fas fa-times-circle" style={{ marginRight: '6px' }}></i>
                          {errorMsg}
                        </div>
                      )}

                      {/* ── Password fields ─────────────────────────────── */}
                      <div className="row mrg-r-10 mrg-l-10">

                        {/* Current Password */}
                        <div className="col-lg-12" style={{ marginBottom: '8px' }}>
                          <label style={{ fontWeight: '600', fontSize: '13px', color: '#555' }}>
                            Current Password <span style={{ color: '#f44336' }}>*</span>
                          </label>
                          <div style={inputWrap}>
                            <input
                              type={showCurrent ? 'text' : 'password'}
                              className="form-control"
                              placeholder="Enter your current password"
                              value={currentPassword}
                              onChange={(e) => {
                                setCurrentPassword(e.target.value);
                                setErrors(prev => ({ ...prev, currentPassword: '' }));
                                setErrorMsg('');
                              }}
                              style={inputStyle(errors.currentPassword)}
                            />
                            <EyeBtn show={showCurrent} toggle={() => setShowCurrent(p => !p)} />
                          </div>
                          {errors.currentPassword && (
                            <span style={errorStyle}>{errors.currentPassword}</span>
                          )}
                        </div>

                        {/* New Password */}
                        <div className="col-lg-6" style={{ marginBottom: '8px' }}>
                          <label style={{ fontWeight: '600', fontSize: '13px', color: '#555' }}>
                            New Password <span style={{ color: '#f44336' }}>*</span>
                          </label>
                          <div style={inputWrap}>
                            <input
                              type={showNew ? 'text' : 'password'}
                              className="form-control"
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => {
                                setNewPassword(e.target.value);
                                checkStrength(e.target.value);
                                setErrors(prev => ({ ...prev, newPassword: '' }));
                              }}
                              style={inputStyle(errors.newPassword)}
                            />
                            <EyeBtn show={showNew} toggle={() => setShowNew(p => !p)} />
                          </div>
                          <StrengthBar />
                          {errors.newPassword && (
                            <span style={errorStyle}>{errors.newPassword}</span>
                          )}
                        </div>

                        {/* Confirm New Password */}
                        <div className="col-lg-6" style={{ marginBottom: '8px' }}>
                          <label style={{ fontWeight: '600', fontSize: '13px', color: '#555' }}>
                            Confirm New Password <span style={{ color: '#f44336' }}>*</span>
                          </label>
                          <div style={inputWrap}>
                            <input
                              type={showConfirm ? 'text' : 'password'}
                              className="form-control"
                              placeholder="Re-enter new password"
                              value={confirmNewPassword}
                              onChange={(e) => {
                                setConfirmNewPassword(e.target.value);
                                setErrors(prev => ({ ...prev, confirmNewPassword: '' }));
                              }}
                              style={inputStyle(errors.confirmNewPassword)}
                            />
                            <EyeBtn show={showConfirm} toggle={() => setShowConfirm(p => !p)} />
                          </div>
                          {/* Live match indicator */}
                          {confirmNewPassword && newPassword && (
                            <span style={{
                              fontSize: '11px', fontWeight: 'bold',
                              color: confirmNewPassword === newPassword ? '#4CAF50' : '#f44336'
                            }}>
                              {confirmNewPassword === newPassword
                                ? '✅ Passwords match'
                                : '❌ Passwords do not match'}
                            </span>
                          )}
                          {errors.confirmNewPassword && (
                            <span style={errorStyle}>{errors.confirmNewPassword}</span>
                          )}
                        </div>

                      </div>

                      {/* ── Password requirements hint ───────────────────── */}
                      <div style={{
                        background: '#f8f9fa', border: '1px solid #dee2e6',
                        borderRadius: '6px', padding: '10px 14px',
                        margin: '12px 10px', fontSize: '12px', color: '#666'
                      }}>
                        <strong style={{ display: 'block', marginBottom: '4px' }}>
                          Password requirements:
                        </strong>
                        <span style={{ color: newPassword.length >= 6 ? '#4CAF50' : '#999' }}>
                          {newPassword.length >= 6 ? '✓' : '○'} At least 6 characters
                        </span><br />
                        <span style={{ color: /[A-Z]/.test(newPassword) ? '#4CAF50' : '#999' }}>
                          {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter
                        </span><br />
                        <span style={{ color: /[0-9]/.test(newPassword) ? '#4CAF50' : '#999' }}>
                          {/[0-9]/.test(newPassword) ? '✓' : '○'} One number
                        </span>
                      </div>

                      {/* ── Submit button ───────────────────────────────── */}
                      <div className="text-center" style={{ marginTop: '20px' }}>
                        <button
                          type="submit"
                          className="sub"
                          disabled={loading}
                          style={{
                            opacity: loading ? 0.7 : 1,
                            cursor:  loading ? 'not-allowed' : 'pointer',
                            minWidth: '180px'
                          }}
                        >
                          {loading
                            ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>Updating...</>
                            : <><i className="fas fa-lock" style={{ marginRight: '6px' }}></i>Update Password</>
                          }
                        </button>
                      </div>

                    </form>
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

export default ChangePassword;