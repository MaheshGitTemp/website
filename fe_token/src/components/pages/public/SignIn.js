import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import backImg from '../../templates/ImagesLoader'
import { AuthContext } from '../../hooks/AuthContext'
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/ToastContext';

const SignIn = () => {
  const [userEmail,setUserEmail]=useState();
  const [userPassword,setUserPassword]=useState();
  const [showPassword, setShowPassword] = useState(false);
  const authcontext= useContext(AuthContext)
  const {isLoggedIn,login}=authcontext;
  
const { showToast } = useToast();
  const navigate=useNavigate();
  // useEffect(() => { if (isLoggedIn) { navigate('/profiles'); } }, [isLoggedIn, navigate]);
  // Redirect if already logged in
useEffect(() => { 
  if (isLoggedIn) { navigate('/profiles'); }
}, [isLoggedIn, navigate]);

// Also redirect if another tab logs in while this tab is on login page
useEffect(() => {
  const handleStorage = (e) => {
    if (e.key === 'isLoggedIn' && e.newValue === 'true') {
      navigate('/profiles');
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}, [navigate]);
  // const loginHandler=(e)=>{
  //   e.preventDefault();
  //   login(userEmail,userPassword);
  // }
  
// In loginHandler, after calling login():
// Since login() is async in AuthContext, update SignIn.js loginHandler:
const loginHandler = async (e) => {
  e.preventDefault();
  try {
    const response = await login(userEmail, userPassword);
    if (localStorage.getItem('isLoggedIn') === 'true') {
      showToast({
        title:       'Welcome Back! 👋',
        description: 'You have successfully logged in.',
        type:        'success'
      });
      // navigate happens via useEffect already
    } else {
      showToast({
        title:       'Login Failed',
        description: 'Invalid email or password. Please check your credentials.',
        type:        'error'
      });
    }
  } catch (err) {
    showToast({
      title:       'Login Failed',
      description: 'Something went wrong. Please try again.',
      type:        'error'
    });
  }
};
  return (
    <>
    <div className="pageSearch" >
      <div className="container" >
        <div className="searchform" >
          <div className="row" >
            <div className="col-lg-3 col-md-6">
              <select name="" id="" className="form-control">
                <option value="">Looking For</option>
                <option value="">Bride (Female)</option>
                <option value="">Groom (Male)</option>
              </select>
            </div>

            <div className="col-lg-2 col-md-3">
              <input type="number" className="form-control" placeholder="Age From"/>
            </div>
            <div className="col-lg-2 col-md-3">
              <input type="number" className="form-control" placeholder="Age To"/>
            </div>
            <div className="col-lg-3 col-md-6">
              <select name="" className="form-control">
                <option value="">Choose one</option>
                <option value="1">Never Married</option>
                <option value="2">Married</option>
                <option value="3">Divorced </option>
                <option value="4">Separated </option>
                <option value="5">Widowed</option>
              </select>
            </div>
            <div className="col-lg-2 col-md-6">
              <button type="submit" className="btn"><i className="fas fa-search"></i> Search</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
     {/* Inner Content Start-->  */}
    <div className="inner-content loginbg" style={{backgroundImage:`URL(${backImg.loginbg1})`, backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover"}}>
      <div className="container"> 
        
         {/* Wedding Register Start-->  */}
        <div className="quick-wrap loginWrp">
          <h3>User Login</h3>
          <form onSubmit={loginHandler}>
            <div className="input-group">
              <label className="input-group-append">Email</label>
              <input type="text" name="email" placeholder="Email" className="form-control"  onChange={(e)=>setUserEmail(e.target.value)}/>
            </div>
            {/* <div className="input-group">
              <label className="input-group-append">Password <span><a href="#">Forgot password?</a></span></label>
              <input type="text" name="password" placeholder="Password" className="form-control" onChange={(e)=>setUserPassword(e.target.value)}/>
            </div> */}
             {/* Password Field with Toggle */}
            <div className="input-group" style={{ position: 'relative' }}>
              {/* <label className="input-group-append">Password <span><a href="#">Forgot password?</a></span></label> */}
              {/* // REPLACE WITH: */}
<label className="input-group-append">
  Password <span><Link to="/forgotpassword" style={{ color: '#a84040' }}>Forgot password?</Link></span>
</label>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="Password" 
                className="form-control" 
                onChange={(e)=>setUserPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '38px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '5px',
                  zIndex: 10
                }}
              >
                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
              </button>
            </div>
            <div className="input-group checkbox">
              <input type="checkbox" name="checkname" id="termscond"/>
              <label htmlFor="termscond"></label>
              Remember Me </div>
            <div className="input-group">
              <input type="submit" value="Submit" className="sub"/>
            </div>
            <div className="loginformtext"><a href="signup.html" style={{color:"#a84040", fontSize:"16px"}}>Join Now – Free !</a></div>
          </form>
        </div>
         {/* Wedding Register End-->  */} 
        
      </div>
    </div>
     {/* Inner Content End-->  */} 
    
  
    </>
  )
}

export default SignIn