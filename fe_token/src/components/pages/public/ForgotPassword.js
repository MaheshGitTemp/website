// src/components/pages/public/ForgotPassword.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import backImg from '../../templates/ImagesLoader';
import { sendOtp, verifyOtp, resetPassword } from '../../../services/authService';
import { useToast } from '../../../components/hooks/ToastContext';
const ForgotPassword = () => {
  const navigate = useNavigate();
const { showToast } = useToast();
 
  // ── Step state: 1=email, 2=otp, 3=new password, 4=success ───────────────
  const [step, setStep] = useState(1);

  // ── Form state ────────────────────────────────────────────────────────────
  const [email,           setEmail]           = useState('');
  const [otp,             setOtp]             = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [resendTimer,  setResendTimer]  = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // ── Eye toggle ────────────────────────────────────────────────────────────
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Password strength ─────────────────────────────────────────────────────
  const [strength, setStrength] = useState('');

  // ── Start resend countdown ────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Password strength checker ─────────────────────────────────────────────
  const checkStrength = (pwd) => {
    if (!pwd) { setStrength(''); return; }
    let score = 0;
    if (pwd.length >= 6)                         score++;
    if (pwd.length >= 10)                        score++;
    if (/[A-Z]/.test(pwd))                       score++;
    if (/[a-z]/.test(pwd))                       score++;
    if (/[0-9]/.test(pwd))                       score++;
    if (/[!@#$%^&*()_+\-=\[\]{}]/.test(pwd))    score++;
    if      (score <= 2) setStrength('weak');
    else if (score <= 4) setStrength('medium');
    else                 setStrength('strong');
  };

  // ── STEP 1: Send OTP to email ─────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.'); return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.'); return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(email);
      if (res.data.status === 'Success') {
        showToast({
  title:       'OTP Sent',
  description: `A 6-digit OTP has been sent to your email. Valid for 10 minutes.`,
  type:        'info'
});
        setStep(2);
        startResendTimer();
      } else {
        setErrorMsg(res.data.result || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otp || otp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP sent to your email.'); return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email, otp);
      if (res.data.status === 'Success') {
        // OTP verified:
showToast({
  title:       'OTP Verified ✓',
  description: 'Identity confirmed. Please set your new password.',
  type:        'success'
});
        setStep(3);
      } else {
        setErrorMsg(res.data.result || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setResendLoading(true);
    setErrorMsg('');
    setOtp('');
    try {
      const res = await sendOtp(email);
      if (res.data.status === 'Success') {
        startResendTimer();
      } else {
        setErrorMsg('Failed to resend OTP. Please try again.');
      }
    } catch {
      setErrorMsg('Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  // ── STEP 3: Reset Password ─────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword) {
      setErrorMsg('Please enter a new password.'); return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.'); return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setErrorMsg('Password must contain at least one uppercase letter.'); return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setErrorMsg('Password must contain at least one number.'); return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.'); return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email, newPassword);
      if (res.data.status === 'Success') {
        showToast({
  title:       'Password Reset Successful',
  description: 'Your password has been changed. Please login with your new password.',
  type:        'success',
  duration:    5000
});
        setStep(4);
      } else {
        setErrorMsg(res.data.result || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const cardStyle = {
    maxWidth: '480px',
    margin: '0 auto',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    overflow: 'hidden'
  };

  const headerStyle = {
    background: 'linear-gradient(90deg, #a84040 0%, #8B0000 100%)',
    padding: '28px 32px',
    textAlign: 'center'
  };

  const bodyStyle = { padding: '32px' };

  const inputStyle = (hasError) => ({
    width: '100%', height: '48px',
    padding: '0 16px', fontSize: '15px',
    border: hasError ? '2px solid #f44336' : '2px solid #dee2e6',
    borderRadius: '8px', outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  });

  const btnStyle = (disabled) => ({
    width: '100%', height: '48px',
    background: disabled
      ? '#e0e0e0'
      : 'linear-gradient(90deg, #a84040 0%, #8B0000 100%)',
    color: disabled ? '#999' : '#fff',
    border: 'none', borderRadius: '8px',
    fontSize: '15px', fontWeight: '700',
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: '8px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '8px'
  });

  const errorBoxStyle = {
    background: '#fdecea', border: '1px solid #f44336',
    borderRadius: '8px', padding: '12px 16px',
    color: '#c62828', fontSize: '13px',
    marginBottom: '16px',
    display: 'flex', alignItems: 'center', gap: '8px'
  };

  const labelStyle = {
    display: 'block', fontWeight: '600',
    fontSize: '13px', color: '#555',
    marginBottom: '8px'
  };

  // Step indicator helper
  const StepIndicator = () => (
    <div style={{
      display: 'flex', justifyContent: 'center',
      gap: '8px', marginBottom: '24px'
    }}>
      {[1, 2, 3].map(s => (
        <div key={s} style={{
          width: '32px', height: '6px', borderRadius: '3px',
          background: step > s
            ? '#4CAF50'
            : step === s
              ? '#a84040'
              : '#e0e0e0',
          transition: 'background 0.3s'
        }} />
      ))}
    </div>
  );

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <div
      className="inner-content loginbg"
      style={{ backgroundImage: `URL(${backImg.loginbg})` }}
    >
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <div style={cardStyle}>

          {/* ── Card Header ───────────────────────────────────────────────── */}
          <div style={headerStyle}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <i className="fas fa-key" style={{ color: '#fff', fontSize: '24px' }}></i>
            </div>
            <h4 style={{ color: '#fff', margin: '0 0 4px', fontSize: '22px' }}>
              Forgot Password
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '13px' }}>
              {step === 1 && 'Enter your email to receive a verification code'}
              {step === 2 && `OTP sent to ${email}`}
              {step === 3 && 'Create your new password'}
              {step === 4 && 'Password reset complete'}
            </p>
          </div>

          {/* ── Card Body ─────────────────────────────────────────────────── */}
          <div style={bodyStyle}>

            {/* Step indicator — only for steps 1-3 */}
            {step < 4 && <StepIndicator />}

            {/* Error message */}
            {errorMsg && (
              <div style={errorBoxStyle}>
                <i className="fas fa-times-circle"></i>
                {errorMsg}
              </div>
            )}

            {/* ── STEP 1: Enter Email ──────────────────────────────────── */}
            {step === 1 && (
              <form onSubmit={handleSendOtp}>
                <label style={labelStyle}>
                  Email Address <span style={{ color: '#f44336' }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                  style={inputStyle(!!errorMsg)}
                  onFocus={e => { e.target.style.borderColor = '#a84040'; }}
                  onBlur={e => { e.target.style.borderColor = '#dee2e6'; }}
                />
                <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  We'll send a 6-digit OTP to this email address.
                </p>
                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading
                    ? <><i className="fas fa-spinner fa-spin"></i>Sending OTP...</>
                    : <><i className="fas fa-paper-plane"></i>Send OTP</>
                  }
                </button>
              </form>
            )}

            {/* ── STEP 2: Verify OTP ───────────────────────────────────── */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp}>
                {/* Email display */}
                <div style={{
                  background: '#f8f9fa', borderRadius: '8px',
                  padding: '12px 16px', marginBottom: '20px',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <i className="far fa-envelope" style={{ color: '#a84040' }}></i>
                  <span style={{ fontSize: '14px', color: '#555' }}>{email}</span>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(''); setErrorMsg(''); }}
                    style={{
                      marginLeft: 'auto', background: 'none', border: 'none',
                      color: '#a84040', cursor: 'pointer', fontSize: '12px',
                      textDecoration: 'underline'
                    }}
                  >
                    Change
                  </button>
                </div>

                <label style={labelStyle}>
                  Enter 6-digit OTP <span style={{ color: '#f44336' }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="_ _ _ _ _ _"
                  value={otp}
                  onChange={e => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setErrorMsg('');
                  }}
                  style={{
                    ...inputStyle(!!errorMsg),
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: '800',
                    letterSpacing: '12px'
                  }}
                />

                {/* Resend */}
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  {resendTimer > 0 ? (
                    <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
                      Resend OTP in <strong style={{ color: '#a84040' }}>{resendTimer}s</strong>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendLoading}
                      style={{
                        background: 'none', border: 'none',
                        color: '#a84040', cursor: 'pointer',
                        fontSize: '13px', textDecoration: 'underline'
                      }}
                    >
                      {resendLoading ? '⏳ Sending...' : '🔄 Resend OTP'}
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  style={btnStyle(loading || otp.length !== 6)}
                >
                  {loading
                    ? <><i className="fas fa-spinner fa-spin"></i>Verifying...</>
                    : <><i className="fas fa-check-circle"></i>Verify OTP</>
                  }
                </button>
              </form>
            )}

            {/* ── STEP 3: Set New Password ─────────────────────────────── */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>

                {/* New Password */}
                <label style={labelStyle}>
                  New Password <span style={{ color: '#f44336' }}>*</span>
                </label>
                <div style={{ position: 'relative', marginBottom: '4px' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value);
                      checkStrength(e.target.value);
                      setErrorMsg('');
                    }}
                    style={{ ...inputStyle(!!errorMsg), paddingRight: '44px' }}
                  />
                  <button type="button" onClick={() => setShowNew(p => !p)} style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: '#888', cursor: 'pointer'
                  }}>
                    <i className={showNew ? 'far fa-eye-slash' : 'far fa-eye'}></i>
                  </button>
                </div>

                {/* Strength bar */}
                {strength && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {['weak', 'medium', 'strong'].map((level, i) => (
                        <div key={i} style={{
                          height: '4px', flex: 1, borderRadius: '2px',
                          background: (
                            strength === 'weak'   && i === 0 ? '#f44336' :
                            strength === 'medium' && i <= 1  ? '#FFC107' :
                            strength === 'strong'             ? '#4CAF50' : '#e0e0e0'
                          )
                        }} />
                      ))}
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 'bold',
                      color: strength === 'weak' ? '#f44336' : strength === 'medium' ? '#FFC107' : '#4CAF50'
                    }}>
                      {strength === 'weak' ? '⚠ Weak' : strength === 'medium' ? '👍 Medium' : '✅ Strong'}
                    </span>
                  </div>
                )}

                {/* Confirm Password */}
                <label style={{ ...labelStyle, marginTop: '8px' }}>
                  Confirm New Password <span style={{ color: '#f44336' }}>*</span>
                </label>
                <div style={{ position: 'relative', marginBottom: '4px' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                    style={{ ...inputStyle(!!errorMsg), paddingRight: '44px' }}
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: '#888', cursor: 'pointer'
                  }}>
                    <i className={showConfirm ? 'far fa-eye-slash' : 'far fa-eye'}></i>
                  </button>
                </div>

                {/* Match indicator */}
                {confirmPassword && newPassword && (
                  <span style={{
                    fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '12px',
                    color: confirmPassword === newPassword ? '#4CAF50' : '#f44336'
                  }}>
                    {confirmPassword === newPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
                  </span>
                )}

                {/* Requirements */}
                <div style={{
                  background: '#f8f9fa', borderRadius: '8px',
                  padding: '12px 14px', marginBottom: '16px', fontSize: '12px'
                }}>
                  {[
                    { check: newPassword.length >= 6, text: 'At least 6 characters'        },
                    { check: /[A-Z]/.test(newPassword), text: 'One uppercase letter'        },
                    { check: /[0-9]/.test(newPassword), text: 'One number'                  }
                  ].map((req, i) => (
                    <div key={i} style={{ color: req.check ? '#4CAF50' : '#999', marginBottom: '3px' }}>
                      {req.check ? '✓' : '○'} {req.text}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={btnStyle(loading)}
                >
                  {loading
                    ? <><i className="fas fa-spinner fa-spin"></i>Resetting Password...</>
                    : <><i className="fas fa-lock"></i>Reset Password</>
                  }
                </button>
              </form>
            )}

            {/* ── STEP 4: Success ──────────────────────────────────────── */}
            {step === 4 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: '#e6f9ee',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <i className="fas fa-check-circle" style={{ fontSize: '36px', color: '#4CAF50' }}></i>
                </div>
                <h5 style={{ color: '#2e7d32', marginBottom: '8px' }}>
                  Password Reset Successful!
                </h5>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
                  Your password has been updated successfully.<br />
                  You can now login with your new password.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  style={btnStyle(false)}
                >
                  <i className="fas fa-sign-in-alt"></i>
                  Go to Login
                </button>
              </div>
            )}

            {/* ── Back to Login link ─────────────────────────────────── */}
            {step < 4 && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/login" style={{ color: '#888', fontSize: '13px' }}>
                  <i className="fas fa-arrow-left" style={{ marginRight: '4px' }}></i>
                  Back to Login
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;