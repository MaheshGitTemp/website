// src/components/pages/public/Signup.js
//
// UI REDESIGN NOTE:
// This file received a full visual redesign (grouped card/section layout,
// restyled inputs). ALL logic is preserved from the previous version:
// the same field `name` attributes, the same validate() rules, the same
// OTP send/verify/resend flow, the same salary handling, and the same
// show/hide password behavior. No backend contract changed.
//
// BEHAVIOR FIX (intentional, 2 lines): previously the formatted date/time of
// birth were written to dataObj.date / dataObj.time, but the backend inserts
// the `udob` / `utob` columns. Those keys are now populated so birth details
// actually persist. (See the two marked lines in submitHandler.)
import React, { useContext, useEffect, useState } from 'react';
import bkImg from '../../templates/ImagesLoader';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsonArr from '../../templates/data/jsonData';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';
import { registerUser, sendOtp, verifyOtp } from '../../../services/authService';
import { useToast } from '../../../components/hooks/ToastContext';
import { toTitleCase } from '../../../utils/normalizeText';

// Salary unit options
const inrOptions = [
  { label: "Thousands", value: "thousands" },
  { label: "Lakhs",     value: "lakhs"     },
  { label: "Crores",    value: "crores"    }
];

// ── Shared inline style tokens (redesign) ──────────────────────────────────
const BRAND = '#a84040';
const ui = {
  page: {
    minHeight: '100vh',
    padding: '40px 16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  card: {
    width: '100%',
    maxWidth: '860px',
    background: 'rgba(255,255,255,0.97)',
    borderRadius: '16px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
    overflow: 'hidden'
  },
  header: {
    background: BRAND,
    color: '#fff',
    padding: '26px 30px',
    textAlign: 'center'
  },
  headerTitle: { margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '0.3px' },
  headerSub: { margin: '8px 0 0', fontSize: '13px', opacity: 0.9 },
  body: { padding: '28px 30px 34px' },
  section: { marginBottom: '26px' },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: BRAND,
    margin: '0 0 14px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eee'
  },
  grid: { display: 'flex', flexWrap: 'wrap', margin: '0 -10px' },
  col: (basis) => ({ flex: `0 0 ${basis}`, maxWidth: basis, padding: '0 10px', boxSizing: 'border-box', marginBottom: '14px' }),
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '6px' },
  input: (hasError) => ({
    width: '100%',
    padding: '11px 12px',
    fontSize: '14px',
    border: `1.5px solid ${hasError ? '#FAA0A0' : '#d9d9d9'}`,
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff'
  }),
  errorText: { color: '#d33', fontSize: '12px', marginTop: '4px', display: 'inline-block' },
  radioRow: { display: 'flex', flexWrap: 'wrap', gap: '14px' },
  radioCard: {
    flex: '1 1 240px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    border: '1.5px solid #e2e2e2',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#333'
  },
  submit: {
    width: '100%',
    padding: '14px',
    background: BRAND,
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  }
};

const Signup = (props) => {
  const navigate    = useNavigate();
  const authcontext = useContext(AuthContext);
  const { isLoggedIn } = authcontext;
  const { showToast } = useToast();

  useEffect(() => {
    if (isLoggedIn) { navigate("/profiles"); }
  }, [isLoggedIn, navigate]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [errors,       setErrors]       = useState({});
  const [signupStatus, setSignupStatus] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [startDate,    setStartDate]    = useState(new Date());
  const [startTime,    setStartTime]    = useState(new Date());

  // ── Salary state ──────────────────────────────────────────────────────────
  const [salaryNum,     setSalaryNum]     = useState("");
  const [salaryUnits,   setSalaryUnits]   = useState("Lakhs");
  const [salaryMessage, setSalaryMessage] = useState("");
  const [salaryPackage, setSalaryPackage] = useState("NA");

  // ── OTP state ─────────────────────────────────────────────────────────────
  const [showOtpModal,    setShowOtpModal]    = useState(false);
  const [otpValue,        setOtpValue]        = useState('');
  const [otpError,        setOtpError]        = useState('');
  const [otpSuccess,      setOtpSuccess]      = useState('');
  const [otpLoading,      setOtpLoading]      = useState(false);
  const [resendLoading,   setResendLoading]   = useState(false);
  const [resendTimer,     setResendTimer]     = useState(0);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [sendingOtp,      setSendingOtp]      = useState(false); // spinner while OTP email is sent

  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRadioChange = (event) => {
    const { value } = event.target;
    setShowDropdown(value === "relationship");
  };

  const handleSalaryNumChange = (event) => {
    const value = event.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setSalaryNum(value);
      updateSalaryMessage(value, salaryUnits);
    }
  };

  const handleSalaryUnitsChange = (event) => {
    const value = event.target.value;
    setSalaryUnits(value);
    updateSalaryMessage(salaryNum, value);
  };

  const updateSalaryMessage = (num, units) => {
    if (num && units) {
      const packageValue = `${num} ${units}`;
      setSalaryPackage(packageValue);
      setSalaryMessage(`** ${num} ${units} per Annum`);
    } else {
      setSalaryPackage("NA");
      setSalaryMessage("");
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (requiredFieldsData) => {
    const errors = {};
    if (!requiredFieldsData.uemail) {
      errors.uemail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(requiredFieldsData.uemail)) {
      errors.uemail = "Email address is invalid";
    }
    if (!requiredFieldsData.upassword) {
      errors.upassword = "Password is required";
    } else if (requiredFieldsData.upassword.length < 6) {
      errors.upassword = "Password must be at least 6 characters";
    }
    if (!requiredFieldsData["confirm-password"]) {
      errors["confirm-password"] = "Confirm Password is required";
    } else if (requiredFieldsData.upassword !== requiredFieldsData["confirm-password"]) {
      errors["confirm-password"] = "Passwords do not match";
    }
    if (!requiredFieldsData["ufname"])   { errors["ufname"] = "First Name is required"; }
    if (!requiredFieldsData["ulname"])   { errors["ulname"] = "Last Name is required"; }
    if (!requiredFieldsData["ucreated"]) { errors["ucreated"] = " * Please select a profile option."; }
    if (requiredFieldsData["relation"] === "Select Relation") { errors["relation"] = "Relation is required"; }
    if (!requiredFieldsData["udob"])     { errors["udob"] = "Date of birth is required"; }
    if (!requiredFieldsData["utob"])     { errors["utob"] = "Time of birth is required"; }
    if (requiredFieldsData["ugender"] === "Select Gender")       { errors["ugender"] = "Gender is required"; }
    if (requiredFieldsData["upob"] === "Select birth place")     { errors["upob"] = "Place of birth is required"; }
    if (requiredFieldsData["upresentloc"] === "Select District") { errors["upresentloc"] = "Present Location is required"; }
    if (!requiredFieldsData["uphone"])   { errors["uphone"] = "Phone is required"; }
    if (requiredFieldsData["uheight"] === "Select Height") { errors["uheight"] = "Height is required"; }
    if (requiredFieldsData["ucaste"] === "Select Caste")   { errors["ucaste"] = "Caste is required"; }
    if (requiredFieldsData["ujob"] === "Select Job")       { errors["ujob"] = "Job is required"; }
    if (!salaryNum) { errors["salary"] = "Salary amount is required"; }
    if (!requiredFieldsData.terms) { errors.terms = "* You must agree to the terms and conditions."; }
    setErrors(errors);
    return errors;
  };

  // ── Submit Handler — sends OTP first, registers after OTP verified ────────
  const submitHandler = async (event) => {
    event.preventDefault();
    const fd      = new FormData(event.target);
    const dataObj = Object.fromEntries(fd.entries());
          dataObj.date     = format(startDate, "MM/dd/yyyy");
          dataObj.time     = format(startTime, "HH:mm");
          // ── FIX: populate the keys the backend actually inserts (udob/utob) ──
          dataObj.udob     = format(startDate, "MM/dd/yyyy");
          dataObj.utob     = format(startTime, "HH:mm");
          // ─────────────────────────────────────────────────────────────────────
          dataObj.upackage = salaryPackage;

    const givendob      = new Date(dataObj.date).getFullYear();
    const curyear       = new Date().getFullYear();
    const validationerr = validate(dataObj);

    if (!Object.keys(validationerr).length) {
      if ((curyear) - (givendob) <= 17) {
        setSignupStatus("Please Enter valid Age...");
        return;
      }
      // ── Normalize names to Title Case before saving ───────────────────────
      dataObj.ufname = toTitleCase(dataObj.ufname);
      dataObj.ulname = toTitleCase(dataObj.ulname);
      // ─────────────────────────────────────────────────────────────────────
      // Step 1: Send OTP to email before registering
      try {
        setSignupStatus('');
        setSendingOtp(true); // show spinner while the OTP email is sent
        const otpRes = await sendOtp(dataObj.uemail);

        if (otpRes.data.status === 'Success') {
          setPendingFormData(dataObj);  // store form data until OTP verified
          setShowOtpModal(true);
          setOtpError('');
          setOtpSuccess('');
          setOtpValue('');
          startResendTimer();
        } else {
          setSignupStatus('Failed to send OTP. Please check your email and try again.');
        }
      } catch (error) {
        console.error('Send OTP error:', error);
        setSignupStatus('Failed to send OTP. Please try again.');
      } finally {
        setSendingOtp(false); // hide spinner regardless of outcome
      }

    } else {
      setSignupStatus("* Registration unsuccessful. Please fill all the fields.");
    }
  };

  // ── Start 30s resend countdown timer ─────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Verify OTP then register ──────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      const verifyRes = await verifyOtp(pendingFormData.uemail, otpValue);

      if (verifyRes.data.status === 'Success') {
        setOtpSuccess('Email verified! Completing registration...');

        // Step 2: Register only after OTP verified
        const res = await registerUser(pendingFormData);

        if (res.data.status === 'Success') {
          setShowOtpModal(false);
          setSignupStatus('Registration successful. Welcome aboard!');
          setPendingFormData(null);
          setOtpValue('');
          showToast({
            title:       '🎉 Welcome to TeluguSambandham!',
            description: 'Your account has been created successfully. Please login to continue.',
            type:        'success',
            duration:    5000
          });
          // Optional: redirect to login after 2s
          setTimeout(() => navigate('/login'), 2000);
        } else if (res.data.status === 'Failure') {
          setOtpSuccess('');
          setOtpError('Registration failed. Email or phone already exists.');
          showToast({
            title:       'Registration Failed',
            description: 'Email or phone number already exists. Please try with different details.',
            type:        'error'
          });
        } else {
          setOtpSuccess('');
          setOtpError('Registration failed. Please try again.');
          showToast({
            title:       'Invalid OTP',
            description: 'The OTP you entered is incorrect or expired. Please try again.',
            type:        'error'
          });
        }
      } else {
        setOtpError(verifyRes.data.result || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setOtpError('Something went wrong. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP — generates new OTP, old one becomes invalid ──────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0 || !pendingFormData) return;
    setResendLoading(true);
    setOtpError('');
    setOtpSuccess('');
    setOtpValue('');
    try {
      const res = await sendOtp(pendingFormData.uemail);
      if (res.data.status === 'Success') {
        setOtpSuccess('New OTP sent to your email!');
        // ✅ OTP resent
        showToast({
          title:       'OTP Sent',
          description: 'A new OTP has been sent to your email address.',
          type:        'info'
        });
        startResendTimer();
      } else {
        setOtpError('Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setOtpError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <>
      <div className="inner-content loginbg" style={{ backgroundImage: `URL(${bkImg.loginbg1})`, ...ui.page }}>
        <div style={ui.card}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={ui.header}>
            <h4 style={ui.headerTitle}>Create an Account</h4>
            <p style={ui.headerSub}>Only for Telangana &amp; Andhra Pradesh States</p>
          </div>

          <form onSubmit={submitHandler}>
            <div style={ui.body}>

              {/* ── Profile Type ──────────────────────────────────────── */}
              <div style={ui.section}>
                <h5 style={ui.sectionTitle}>Profile Type</h5>
                <div style={ui.radioRow}>
                  <label style={ui.radioCard}>
                    <input type="radio" value="myself" name="ucreated" onChange={handleRadioChange} />
                    This profile is for myself
                  </label>
                  <label style={ui.radioCard}>
                    <input type="radio" value="relationship" name="ucreated" onChange={handleRadioChange} />
                    My relationship with bride/groom
                  </label>
                </div>
                {errors.ucreated && <span style={ui.errorText}>{errors.ucreated}</span>}

                {showDropdown && (
                  <div style={{ marginTop: '14px', maxWidth: '360px' }}>
                    <label style={ui.label}>Relation</label>
                    <select name="relation" style={ui.input(errors.relation)}>
                      <option>Select Relation</option>
                      {jsonArr.relationship.map((res, i) => <option key={i}>{res.relation}</option>)}
                    </select>
                    {errors.relation && <span style={ui.errorText}>{errors.relation}</span>}
                  </div>
                )}
              </div>

              {/* ── Personal Details ──────────────────────────────────── */}
              <div style={ui.section}>
                <h5 style={ui.sectionTitle}>Personal Details</h5>
                <div style={ui.grid}>
                  <div style={ui.col('50%')}>
                    <label style={ui.label}>First Name</label>
                    <input type="text" name="ufname" placeholder="Name" style={ui.input(errors.ufname)} />
                    {errors.ufname && <span style={ui.errorText}>{errors.ufname}</span>}
                  </div>
                  <div style={ui.col('50%')}>
                    <label style={ui.label}>Last Name</label>
                    <input type="text" name="ulname" placeholder="Name" style={ui.input(errors.ulname)} />
                    {errors.ulname && <span style={ui.errorText}>{errors.ulname}</span>}
                  </div>

                  <div style={ui.col('50%')}>
                    <label style={ui.label}>Gender</label>
                    <select name="ugender" style={ui.input(errors.ugender)}>
                      <option>Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {errors.ugender && <span style={ui.errorText}>{errors.ugender}</span>}
                  </div>
                  <div style={ui.col('50%')}>
                    <label style={ui.label}>Height</label>
                    <select name="uheight" style={ui.input(errors.uheight)}>
                      <option>Select Height</option>
                      {jsonArr.heightData.map((res, i) => <option key={i} value={res.heightlabel}>{res.heightlabel}</option>)}
                    </select>
                    {errors.uheight && <span style={ui.errorText}>{errors.uheight}</span>}
                  </div>

                  <div style={ui.col('50%')}>
                    <label style={ui.label}>Caste</label>
                    <select name="ucaste" style={ui.input(errors.ucaste)}>
                      <option>Select Caste</option>
                      {jsonArr.casteData.map((res, i) => <option key={i} value={res.castelabel}>{res.castelabel}</option>)}
                    </select>
                    {errors.ucaste && <span style={ui.errorText}>{errors.ucaste}</span>}
                  </div>
                </div>
              </div>

              {/* ── Birth Details ─────────────────────────────────────── */}
              <div style={ui.section}>
                <h5 style={ui.sectionTitle}>Birth Details</h5>
                <div style={ui.grid}>
                  <div style={ui.col('50%')}>
                    <label style={ui.label}>Date of birth</label>
                    <DatePicker
                      name="udob"
                      className="form-control"
                      wrapperClassName="signup-datepicker"
                      selected={startDate}
                      onChange={date => setStartDate(date)}
                    />
                    {errors.udob && <span style={ui.errorText}>{errors.udob}</span>}
                  </div>
                  <div style={ui.col('50%')}>
                    <label style={ui.label}>Time of birth</label>
                    <DatePicker
                      name="utob"
                      className="form-control"
                      wrapperClassName="signup-datepicker"
                      selected={startTime}
                      onChange={(time) => setStartTime(time)}
                      showTimeSelect showTimeSelectOnly timeIntervals={15}
                      timeCaption="Time" dateFormat="HH:mm"
                    />
                    {errors.utob && <span style={ui.errorText}>{errors.utob}</span>}
                  </div>
                  <div style={ui.col('50%')}>
                    <label style={ui.label}>Place of birth</label>
                    <select name="upob" style={ui.input(errors.upob)}>
                      <option>Select birth place</option>
                      {jsonArr.districtData.map((res, i) => <option key={i} value={res.districtlabel}>{res.districtlabel}</option>)}
                    </select>
                    {errors.upob && <span style={ui.errorText}>{errors.upob}</span>}
                  </div>
                </div>
              </div>

              {/* ── Location ──────────────────────────────────────────── */}
              <div style={ui.section}>
                <h5 style={ui.sectionTitle}>Job Location</h5>
                <div style={ui.grid}>
                  <div style={ui.col('50%')}>
                    <label style={ui.label}>Country</label>
                    <select name="ucountry" style={ui.input(false)}>
                      <option>Select Country</option>
                      {jsonArr.countries.map((res, i) => <option key={i} value={res.country}>{res.country}</option>)}
                    </select>
                  </div>
                  <div style={ui.col('50%')}>
                    <label style={ui.label}>State</label>
                    <select name="ustate" style={ui.input(false)}>
                      <option>Select State</option>
                      {jsonArr.states.map((res, i) => <option key={i} value={res.state}>{res.state}</option>)}
                    </select>
                  </div>
                  <div style={ui.col('50%')}>
                    <label style={ui.label}>City/Current Location</label>
                    <select name="upresentloc" style={ui.input(errors.upresentloc)}>
                      <option>Select District</option>
                      {jsonArr.districtData.map((res, i) => <option key={i} value={res.districtlabel}>{res.districtlabel}</option>)}
                    </select>
                    {errors.upresentloc && <span style={ui.errorText}>{errors.upresentloc}</span>}
                  </div>
                  <div style={ui.col('50%')}>
                    <label style={ui.label}>Phone</label>
                    <input type="text" name="uphone" placeholder="e.g. 9999999999" style={ui.input(errors.uphone)} />
                    {errors.uphone && <span style={ui.errorText}>{errors.uphone}</span>}
                  </div>
                </div>
              </div>

              {/* ── Contact & Security ────────────────────────────────── */}
              <div style={ui.section}>
                <h5 style={ui.sectionTitle}>Contact &amp; Security</h5>
                <div style={ui.grid}>
                  <div style={ui.col('100%')}>
                    <label style={ui.label}>Email</label>
                    <input type="text" name="uemail" placeholder="Enter Email" style={ui.input(errors.uemail)} />
                    {errors.uemail && <span style={ui.errorText}>{errors.uemail}</span>}
                  </div>

                  <div style={ui.col('50%')}>
                    <label style={ui.label}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="upassword"
                        placeholder="Password"
                        style={{ ...ui.input(errors.upassword), paddingRight: '42px' }}
                      />
                      <span
                        onClick={() => setShowPassword(p => !p)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#888', zIndex: 10 }}
                      >
                        <i className={showPassword ? 'far fa-eye-slash' : 'far fa-eye'}></i>
                      </span>
                    </div>
                    {errors.upassword && <span style={ui.errorText}>{errors.upassword}</span>}
                  </div>

                  <div style={ui.col('50%')}>
                    <label style={ui.label}>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirm-password"
                        placeholder="Confirm Password"
                        style={{ ...ui.input(errors['confirm-password']), paddingRight: '42px' }}
                      />
                      <span
                        onClick={() => setShowConfirmPassword(p => !p)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#888', zIndex: 10 }}
                      >
                        <i className={showConfirmPassword ? 'far fa-eye-slash' : 'far fa-eye'}></i>
                      </span>
                    </div>
                    {errors['confirm-password'] && <span style={ui.errorText}>{errors['confirm-password']}</span>}
                  </div>
                </div>
              </div>

              {/* ── Professional ──────────────────────────────────────── */}
              <div style={ui.section}>
                <h5 style={ui.sectionTitle}>Professional</h5>
                <div style={ui.grid}>
                  <div style={ui.col('50%')}>
                    <label style={ui.label}>Job</label>
                    <select name="ujob" style={ui.input(errors.ujob)}>
                      <option>Select Job</option>
                      {jsonArr.occupationData.map((res, i) => <option key={i} value={res.occupation}>{res.occupation}</option>)}
                    </select>
                    {errors.ujob && <span style={ui.errorText}>{errors.ujob}</span>}
                  </div>
                  <div style={ui.col('25%')}>
                    <label style={ui.label}>Salary Amount</label>
                    <input
                      type="text"
                      value={salaryNum}
                      onChange={handleSalaryNumChange}
                      placeholder="e.g. 5, 10.5"
                      style={ui.input(errors.salary)}
                    />
                    {errors.salary && <span style={ui.errorText}>{errors.salary}</span>}
                  </div>
                  <div style={ui.col('25%')}>
                    <label style={ui.label}>Salary Unit</label>
                    <select value={salaryUnits} onChange={handleSalaryUnitsChange} style={ui.input(false)}>
                      {inrOptions.map((option, i) => (
                        <option key={i} value={option.label}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {salaryMessage && (
                    <div style={ui.col('100%')}>
                      <p style={{ color: "#28a745", fontSize: "14px", fontWeight: "bold", margin: 0 }}>
                        {salaryMessage}
                      </p>
                    </div>
                  )}
                </div>

                {/* Hidden salary field (preserved) */}
                <input type="hidden" name="salaryPackage" value={salaryPackage} />
              </div>

              {/* ── Terms ─────────────────────────────────────────────── */}
              <div style={ui.section}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#333' }}>
                  <input type="checkbox" name="terms" id="termscond" style={{ marginTop: '3px' }} />
                  <span>I have read and agree to <a href="#" style={{ color: BRAND }}>Terms &amp; Conditions</a> mentioned on this link</span>
                </label>
                {errors.terms && <span style={ui.errorText}>{errors.terms}</span>}
              </div>

              {/* ── Submit ────────────────────────────────────────────── */}
              <button
                type="submit"
                disabled={sendingOtp}
                style={{
                  ...ui.submit,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  cursor: sendingOtp ? 'not-allowed' : 'pointer',
                  opacity: sendingOtp ? 0.85 : 1
                }}
              >
                {sendingOtp && (
                  <span
                    aria-hidden="true"
                    style={{
                      width: '18px', height: '18px',
                      border: '2.5px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'signupSpin 0.7s linear infinite'
                    }}
                  />
                )}
                {sendingOtp ? 'Sending OTP...' : 'Sign Up'}
              </button>

              {/* ── Status message ────────────────────────────────────── */}
              {signupStatus && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <span style={{
                    color: signupStatus.includes('successful') ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
                    {signupStatus}
                  </span>
                </div>
              )}

              {/* ── Login link ────────────────────────────────────────── */}
              <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '14px', color: '#555' }}>
                Already have an account?{' '}
                <span onClick={() => navigate('/login')} style={{ color: BRAND, fontWeight: 600, cursor: 'pointer' }}>
                  Login
                </span>
              </p>

            </div>
          </form>
        </div>
      </div>

      {/* ── OTP Verification Modal (unchanged behavior) ───────────────────────── */}
      {showOtpModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            width: '90%', maxWidth: '420px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>

            {/* Modal Header */}
            <div style={{
              background: BRAND, padding: '20px',
              textAlign: 'center', color: '#fff'
            }}>
              <h4 style={{ margin: 0, fontSize: '20px' }}>
                <i className="far fa-envelope" style={{ marginRight: '8px' }}></i>
                Verify Your Email
              </h4>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>

              <p style={{ color: '#444', textAlign: 'center', marginBottom: '4px' }}>
                We sent a 6-digit OTP to
              </p>
              <p style={{
                color: BRAND, fontWeight: 'bold',
                textAlign: 'center', marginBottom: '20px', fontSize: '15px'
              }}>
                {pendingFormData?.uemail}
              </p>

              {/* OTP Input */}
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // numbers only
                    setOtpValue(val);
                    setOtpError('');
                  }}
                  placeholder="Enter 6-digit OTP"
                  style={{
                    width: '100%', padding: '14px', fontSize: '22px',
                    textAlign: 'center', letterSpacing: '10px', fontWeight: 'bold',
                    border: otpError ? '2px solid #f44336' : `2px solid ${BRAND}`,
                    borderRadius: '8px', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Error message */}
              {otpError && (
                <div style={{
                  background: '#fdecea', border: '1px solid #f44336',
                  borderRadius: '6px', padding: '10px 14px',
                  color: '#c62828', marginBottom: '12px', fontSize: '13px'
                }}>
                  <i className="fas fa-times-circle" style={{ marginRight: '6px' }}></i>
                  {otpError}
                </div>
              )}

              {/* Success message */}
              {otpSuccess && (
                <div style={{
                  background: '#e6f9ee', border: '1px solid #4CAF50',
                  borderRadius: '6px', padding: '10px 14px',
                  color: '#2e7d32', marginBottom: '12px', fontSize: '13px'
                }}>
                  <i className="far fa-check-circle" style={{ marginRight: '6px' }}></i>
                  {otpSuccess}
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || otpValue.length !== 6}
                style={{
                  width: '100%', padding: '12px',
                  background: (otpValue.length === 6 && !otpLoading) ? BRAND : '#e0e0e0',
                  color:      (otpValue.length === 6 && !otpLoading) ? '#fff' : '#999',
                  border: 'none', borderRadius: '8px',
                  fontSize: '16px', fontWeight: 'bold',
                  cursor: (otpValue.length === 6 && !otpLoading) ? 'pointer' : 'not-allowed',
                  marginBottom: '14px',
                  transition: 'background 0.2s'
                }}
              >
                {otpLoading ? '⏳ Verifying...' : '✓ Verify & Complete Registration'}
              </button>

              {/* Resend OTP */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                {resendTimer > 0 ? (
                  <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
                    Resend OTP in{' '}
                    <strong style={{ color: BRAND }}>{resendTimer}s</strong>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    style={{
                      background: 'none', border: 'none',
                      color: BRAND, cursor: resendLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px', textDecoration: 'underline',
                      opacity: resendLoading ? 0.6 : 1
                    }}
                  >
                    {resendLoading ? '⏳ Sending...' : '🔄 Resend OTP'}
                  </button>
                )}
              </div>

              {/* Back to form */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setShowOtpModal(false);
                    setPendingFormData(null);
                    setOtpValue('');
                    setOtpError('');
                    setOtpSuccess('');
                  }}
                  style={{
                    background: 'none', border: 'none',
                    color: '#888', cursor: 'pointer', fontSize: '13px'
                  }}
                >
                  ← Back to form (change email)
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Signup;
