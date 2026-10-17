
// src/components/pages/public/Signup.js
import React, { useContext, useEffect, useState } from 'react';
import bkImg from '../../templates/ImagesLoader';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsonArr from '../../templates/data/jsonData';
import axios from 'axios';
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
    title:       '🎉 Welcome to WedsMutual!',
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
      {!signupStatus && <p>{signupStatus}</p>}

      <div className="inner-content loginbg" style={{ backgroundImage: `URL(${bkImg.loginbg1})` }}>
        <div className="container">
          <div className="signup-wrap">
            <form onSubmit={submitHandler}>
              <h4>
                Create an Account
                <p style={{ color: "red" }}>Only for Telangana & Andhra Pradesh States</p>
              </h4>

              {/* Profile Type */}
              <div className="row radiobox">
                <div className="col-lg-5">
                  <div className="radiobtn">
                    <input type="radio" value="myself" name="ucreated" onChange={handleRadioChange} />
                    <i className="checkmark"></i> This profile is for myself
                  </div>
                </div>
                <div className="col-lg-7">
                  <div className="radiobtn">
                    <input type="radio" value="relationship" name="ucreated" onChange={handleRadioChange} />
                    <i className="checkmark"></i> My relationship with bride/groom
                  </div>
                </div>
                <div className="col-lg-12 mt-2" style={{ color: "red" }}>{errors.ucreated}</div>

                {showDropdown && (
                  <div className="col-lg-12 mt-2">
                    <div className="txt02Grey11pt">
                      <select name="relation" className="form-control" style={errors.relation ? { border: "2px solid #FAA0A0" } : {}}>
                        <option>Select Relation</option>
                        {jsonArr.relationship.map((res, i) => <option key={i}>{res.relation}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="row">
                {/* First Name */}
                <div className="col-lg-6">
                  <div className="input-group">
                    <label className="input-group-append">First Name</label>
                    <input type="text" name="ufname" className="form-control" placeholder="Name"
                      style={errors.ufname ? { border: "2px solid #FAA0A0" } : {}} />
                  </div>
                </div>

                {/* Last Name */}
                <div className="col-lg-6">
                  <div className="input-group">
                    <label className="input-group-append">Last Name</label>
                    <input type="text" name="ulname" className="form-control" placeholder="Name"
                      style={errors.ulname ? { border: "2px solid #FAA0A0" } : {}} />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="col-lg-6 mt-2">
                  <div className="input-group">
                    <label className="input-group-append">Date of birth</label>
                    <DatePicker name='udob' className="form-control" selected={startDate}
                      onChange={date => setStartDate(date)}
                      style={errors.udob ? { border: "2px solid #FAA0A0" } : {}} />
                    <i className="fa fa-calendar calendar-icon form-control" aria-hidden="true" />
                  </div>
                </div>

                {/* Time of Birth */}
                <div className="col-lg-6 mt-1">
                  <div className="input-group">
                    <label className="input-group-append">Time of birth</label>
                    <DatePicker name='utob' className='form-control' selected={startTime}
                      onChange={(time) => setStartTime(time)}
                      showTimeSelect showTimeSelectOnly timeIntervals={15}
                      timeCaption="Time" dateFormat="HH:mm"
                      style={errors.utob ? { border: "2px solid #FAA0A0" } : {}} />
                    <i className="fa fa-clock clock-icon form-control" aria-hidden="true" />
                  </div>
                </div>

                {/* Gender */}
                <div className="col-lg-6 mt-2">
                  <div className="input-group">
                    <label className="input-group-append">Gender</label>
                    <select name="ugender" className="form-control"
                      style={errors.ugender ? { border: "2px solid #FAA0A0" } : {}}>
                      <option>Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Place of Birth */}
                <div className="col-lg-6 mt-2">
                  <div className="input-group">
                    <label className="input-group-append">Place of birth</label>
                    <select name="upob" className="form-control"
                      style={errors.upob ? { border: "2px solid #FAA0A0" } : {}}>
                      <option>Select birth place</option>
                      {jsonArr.districtData.map((res, i) => <option key={i} value={res.District}>{res.District}</option>)}
                    </select>
                  </div>
                </div>

                {/* Country */}
                <div className="col-lg-6">
                  <div className="input-group">
                    <label className="input-group-append">Country</label>
                    <select name="ucountry" className="form-control">
                      <option>Select Country</option>
                      {jsonArr.countries.map((res, i) => <option key={i} value={res.country}>{res.country}</option>)}
                    </select>
                  </div>
                </div>

                {/* State */}
                <div className="col-lg-6">
                  <div className="input-group">
                    <label className="input-group-append">State</label>
                    <select name="ustate" className="form-control">
                      <option>Select State</option>
                      {jsonArr.states.map((res, i) => <option key={i} value={res.state}>{res.state}</option>)}
                    </select>
                  </div>
                </div>

                {/* City */}
                <div className="col-lg-6">
                  <div className="input-group">
                    <label className="input-group-append">City/Current Location</label>
                    <select name="upresentloc" className="form-control"
                      style={errors.upresentloc ? { border: "2px solid #FAA0A0" } : {}}>
                      <option>Select District</option>
                      {jsonArr.districtData.map((res, i) => <option key={i} value={res.District}>{res.District}</option>)}
                    </select>
                  </div>
                </div>

                {/* Phone */}
                <div className="col-lg-6">
                  <div className="input-group">
                    <label className="input-group-append">Phone</label>
                    <input type="text" name="uphone" className="form-control" placeholder="e.g. 9999999999"
                      style={errors.uphone ? { border: "2px solid #FAA0A0" } : {}} />
                  </div>
                </div>

                {/* Height */}
                <div className="col-lg-6 mt-2">
                  <div className="input-group">
                    <label className="input-group-append">Height</label>
                    <select name="uheight" className="form-control"
                      style={errors.uheight ? { border: "2px solid #FAA0A0" } : {}}>
                      <option>Select Height</option>
                      {jsonArr.heightData.map((res, i) => <option key={i} value={res.height}>{res.height}</option>)}
                    </select>
                  </div>
                </div>

                {/* Caste */}
                <div className="col-lg-6 mt-2">
                  <div className="input-group">
                    <label className="input-group-append">Caste</label>
                    <select name="ucaste" className="form-control"
                      style={errors.ucaste ? { border: "2px solid #FAA0A0" } : {}}>
                      <option>Select Caste</option>
                      {jsonArr.casteData.map((res, i) => <option key={i} value={res.caste}>{res.caste}</option>)}
                    </select>
                  </div>
                </div>

                {/* Email */}
                <div className="col-lg-12">
                  <div className="input-group">
                    <label className="input-group-append">Email</label>
                    <input type="text" name="uemail" className="form-control" placeholder="Enter Email"
                      style={errors.uemail ? { border: "2px solid #FAA0A0" } : {}} />
                  </div>
                  {errors.uemail && <span style={{ color: "red", fontSize: "12px" }}>{errors.uemail}</span>}
                </div>

                {/* Password */}
                {/* <div className="col-lg-6">
                  <div className="input-group">
                    <label className="input-group-append">Password</label>
                    <input type="password" name="upassword" className="form-control" placeholder="Password"
                      style={errors.upassword ? { border: "2px solid #FAA0A0" } : {}} />
                  </div>
                  {errors.upassword && <span style={{ color: "red", fontSize: "12px" }}>{errors.upassword}</span>}
                </div> */}

{/* REPLACE WITH: */}
<div className="col-lg-6">
  <div className="input-group" style={{ position: 'relative' }}>
    <label className="input-group-append">Password</label>
    <input
      type={showPassword ? 'text' : 'password'}
      name="upassword"
      className="form-control"
      placeholder="Password"
      style={{
        ...(errors.upassword ? { border: "2px solid #FAA0A0" } : {}),
        paddingRight: '42px'
      }}
    />
    <span
      onClick={() => setShowPassword(p => !p)}
      style={{
        position: 'absolute', right: '12px', top: '50%',
        transform: 'translateY(-50%)', cursor: 'pointer',
        color: '#888', zIndex: 10, marginTop: '10px'
      }}
    >
      <i className={showPassword ? 'far fa-eye-slash' : 'far fa-eye'}></i>
    </span>
  </div>
  {errors.upassword && <span style={{ color: "red", fontSize: "12px" }}>{errors.upassword}</span>}
</div>

                {/* Confirm Password */}
                {/* <div className="col-lg-6">
                  <div className="input-group">
                    <label className="input-group-append">Confirm Password</label>
                    <input type="password" name="confirm-password" className="form-control" placeholder="Confirm Password"
                      style={errors['confirm-password'] ? { border: "2px solid #FAA0A0" } : {}} />
                  </div>
                  {errors['confirm-password'] && <span style={{ color: "red", fontSize: "12px" }}>{errors['confirm-password']}</span>}
                </div> */}
{/* REPLACE WITH: */}
<div className="col-lg-6">
  <div className="input-group" style={{ position: 'relative' }}>
    <label className="input-group-append">Confirm Password</label>
    <input
      type={showConfirmPassword ? 'text' : 'password'}
      name="confirm-password"
      className="form-control"
      placeholder="Confirm Password"
      style={{
        ...(errors['confirm-password'] ? { border: "2px solid #FAA0A0" } : {}),
        paddingRight: '42px'
      }}
    />
    <span
      onClick={() => setShowConfirmPassword(p => !p)}
      style={{
        position: 'absolute', right: '12px', top: '50%',
        transform: 'translateY(-50%)', cursor: 'pointer',
        color: '#888', zIndex: 10, marginTop: '10px'
      }}
    >
      <i className={showConfirmPassword ? 'far fa-eye-slash' : 'far fa-eye'}></i>
    </span>
  </div>
  {errors['confirm-password'] && <span style={{ color: "red", fontSize: "12px" }}>{errors['confirm-password']}</span>}
</div>
                {/* Job */}
                <div className="col-lg-6 mt-2">
                  <div className="input-group">
                    <label className="input-group-append">Job</label>
                    <select name="ujob" className="form-control"
                      style={errors.ujob ? { border: "2px solid #FAA0A0" } : {}}>
                      <option>Select Job</option>
                      {jsonArr.occupationData.map((res, i) => <option key={i} value={res.occupation}>{res.occupation}</option>)}
                    </select>
                  </div>
                </div>

                {/* Salary Amount */}
                <div className="col-lg-3 mt-2">
                  <div className="input-group">
                    <label className="input-group-append">Salary Amount</label>
                    <input type="text" value={salaryNum} onChange={handleSalaryNumChange}
                      className="form-control" placeholder="Enter amount (e.g., 5, 10.5)"
                      style={errors.salary ? { border: "2px solid #FAA0A0" } : {}} />
                  </div>
                  {errors.salary && <span style={{ color: "red", fontSize: "12px" }}>{errors.salary}</span>}
                </div>

                {/* Salary Unit */}
                <div className="col-lg-3 mt-2">
                  <div className="input-group">
                    <label className="input-group-append">Salary Unit</label>
                    <select value={salaryUnits} onChange={handleSalaryUnitsChange} className="form-control">
                      {inrOptions.map((option, i) => (
                        <option key={i} value={option.label}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Salary Message */}
                {salaryMessage && (
                  <>
                    <div className="col-6"></div>
                    <div className="col-sm-6">
                      <p style={{ color: "#28a745", fontSize: "14px", fontWeight: "bold", marginTop: "-10px" }}>
                        {salaryMessage}
                      </p>
                    </div>
                  </>
                )}

                {/* Hidden salary field */}
                <input type="hidden" name="salaryPackage" value={salaryPackage} />

                {/* Terms */}
                <div className="col-lg-12">
                  <div className="input-group checkbox">
                    <input type="checkbox" name="terms" id="termscond" />
                    <label htmlFor="termscond"></label>
                    I have Read and agree to <a href="#"> Terms & Conditions </a> mentioned on this link
                  </div>
                  <span style={{ color: "red" }}>{errors.terms}</span>
                </div>

                {/* Submit */}
                <div className="col-lg-4">
                  <div className="input-group">
                    <input type="submit" value="Sign Up" className="sub" />
                  </div>
                </div>

                {/* Status message */}
                {signupStatus && (
                  <div className="col-lg-12">
                    <span style={{
                      color: signupStatus.includes('successful') ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {signupStatus}
                    </span>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── OTP Verification Modal ─────────────────────────────────────────────── */}
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
              background: '#a84040', padding: '20px',
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
                color: '#a84040', fontWeight: 'bold',
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
                    border: otpError ? '2px solid #f44336' : '2px solid #a84040',
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
                  background: (otpValue.length === 6 && !otpLoading) ? '#a84040' : '#e0e0e0',
                  color:      (otpValue.length === 6 && !otpLoading) ? '#fff'    : '#999',
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
                    <strong style={{ color: '#a84040' }}>{resendTimer}s</strong>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    style={{
                      background: 'none', border: 'none',
                      color: '#a84040', cursor: resendLoading ? 'not-allowed' : 'pointer',
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