import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import '../../assets/css/style.css';
import '../../assets/css/bootstrap.min.css';
import '../../assets/css/bootstrap.css';
import '../../assets/css/all.min.css';
import profiles from "../templates/ImagesLoader";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from '../hooks/AuthContext';
import "./dropdown.css";
import { imageUrl } from '../../utils/imageUrl';

// import api from '../../utils/api';
import { fetchUserDetails, fetchUserGallery } from '../../services/userService';
// Replace: import api from '../../utils/api';
import {
  getNotifications,
  getSenderNotifications,
  getUnreadCount,
  markNotificationsRead,
  markSenderNotificationsRead,
  acceptProposal,
  rejectProposal,
  fetchReceivedUnreadCount,   
  fetchSentUnreadCount        
} from '../../services/proposalService';

const Header = () => {

  // ─── Dropdowns ────────────────────────────────────────────────────────────
  const [isDropdownVisible,     setIsDropdownVisible]     = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const navigate    = useNavigate();
  const authcontext = useContext(AuthContext);
  const { loginuser, logout } = authcontext;
  // ✅ stable userId — not recreated on every render
  const userId = React.useMemo(() => localStorage.getItem("userId"), []);

  const logoutHandler = () => { logout(); navigate('/login'); };

  // ─── Mobile ───────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const usernavLiStyle = isMobile
    ? { display: 'block', marginLeft: '0' }
    : { display: 'inline-block', marginLeft: '5px' };

  // ─── Close on outside click ───────────────────────────────────────────────
  const headerRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setIsDropdownVisible(false);
        setIsNotificationVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── User profile ─────────────────────────────────────────────────────────
  const [userDetails, setUserDetails] = useState({});
  const [getGallery,  setGetGallery]  = useState([]);
  // ✅ fetch-once guard
  const profileFetched = useRef(false);

  useEffect(() => {
    if (!userId || profileFetched.current) return;
    profileFetched.current = true;
    const load = async () => {
      try {
        const [detailsRes, galleryRes] = await Promise.all([
          fetchUserDetails(userId),
          fetchUserGallery(userId)
        ]);
        setUserDetails(detailsRes.data);
        setGetGallery(galleryRes.data);
      } catch (e) { console.error('Header profile load error:', e); }
    };
    load();
  }, []); // ✅ empty deps — runs once only

  // const profilePic = getGallery.find(img => img.isprofile)?.imagepath || profiles.authorimg;
  // ✅ Use thumbnail for fast loading, fallback to original, then default avatar
const profilePic = imageUrl(
  getGallery.find(img => img.isprofile)?.imagepath_thumb 
  || getGallery.find(img => img.isprofile)?.imagepath
) || profiles.authorimg;

  // ─── Navbar ───────────────────────────────────────────────────────────────
  const [isActive, setIsActive] = useState(false);

  // =========================================================================
  //  NOTIFICATION STATE
  //  Two separate lists merged into one bell:
  //  1. receivedNotifs  — proposals sent TO me   (I am receiver/User 1)
  //  2. responseNotifs  — responses TO my proposals (I am sender/User 2)
  // =========================================================================
  const [receivedNotifs,  setReceivedNotifs]  = useState([]);  // User 1 view
  const [responseNotifs,  setResponseNotifs]  = useState([]);  // User 2 view
  const [unreadCount,     setUnreadCount]     = useState(0);
  const [notifLoading,    setNotifLoading]    = useState(false);
  const [notifError,      setNotifError]      = useState('');

  // ─── Fetch proposals I received (User 1) ─────────────────────────────────
  const fetchReceivedNotifs = useCallback(async () => {
    if (!userId) return 0;
    try {
      const res = await getNotifications(userId);
      if (res.data.status === 'Success') {
        setReceivedNotifs(res.data.data || []);
        return res.data.unreadCount || 0;
      }
    } catch (err) { console.error('[NOTIF] fetchReceivedNotifs error:', err); }
    return 0;
  }, []); // ✅ empty deps — userId is stable via useMemo

  // ─── Fetch responses to my sent proposals (User 2) ───────────────────────
  const fetchResponseNotifs = useCallback(async () => {
    if (!userId) return 0;
    try {
      const res = await getSenderNotifications(userId);
      if (res.data.status === 'Success') {
        setResponseNotifs(res.data.data || []);
        return res.data.unreadCount || 0;
      }
    } catch (err) { console.error('[NOTIF] fetchResponseNotifs error:', err); }
    return 0;
  }, []); // ✅ empty deps

  // ─── Fetch both + update combined badge count ─────────────────────────────
  const fetchAllNotifications = useCallback(async () => {
    if (!userId) return;
    setNotifLoading(true);
    setNotifError('');
    try {
      const [receivedUnread, responseUnread] = await Promise.all([
        fetchReceivedNotifs(),
        fetchResponseNotifs()
      ]);
      setUnreadCount(receivedUnread + responseUnread);
    } catch (err) {
      console.error('[NOTIF] fetchAllNotifications error:', err);
      setNotifError('Error loading notifications.');
    } finally {
      setNotifLoading(false);
    }
  }, []); // ✅ empty deps

  // ─── Poll badge count every 30s ───────────────────────────────────────────
  const pollUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const [r1, r2] = await Promise.all([
        fetchReceivedUnreadCount(userId),
        fetchSentUnreadCount(userId)
      ]);
      const c1 = r1.data.status === 'Success' ? (r1.data.unreadCount || 0) : 0;
      const c2 = r2.data.status === 'Success' ? (r2.data.unreadCount || 0) : 0;
      setUnreadCount(c1 + c2);
    } catch (err) { console.error('[NOTIF] poll error:', err); }
  }, []); // ✅ empty deps

  // Load on mount + poll every 30s
  // ✅ hasFetched prevents StrictMode double-invoke
  // ✅ fetchAllNotifications and pollUnreadCount have empty deps so stable
  const notifFetched = useRef(false);
  useEffect(() => {
    if (!userId || notifFetched.current) return;
    notifFetched.current = true;
    fetchAllNotifications();
    const interval = setInterval(pollUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []); // ✅ empty deps — runs once only

  // ─── Mark all read (both tables) ─────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!userId) return;
    try {
      await Promise.all([
        markNotificationsRead(userId),
        markSenderNotificationsRead(userId)
      ]);
      setUnreadCount(0);
    } catch (err) {
      console.error('[NOTIF] markAllRead error:', err);
    }
  }, []); // ✅ empty deps

  // ─── Toggle bell ──────────────────────────────────────────────────────────
  const toggleNotification = () => {
    const opening = !isNotificationVisible;
    setIsNotificationVisible(opening);
    setIsDropdownVisible(false);
    if (opening) {
      fetchAllNotifications(); // always fresh when opened
      markAllRead();
    }
  };

  const toggleDropdown = () => {
    setIsDropdownVisible(p => !p);
    setIsNotificationVisible(false);
  };

  // ─── Accept proposal ──────────────────────────────────────────────────────
  const handleAccept = async (proposalId) => {
    try {
      // const res = await api.post('/acceptProposal', {
      //   proposal_id: proposalId,
      //   receiver_id: Number(userId)
      // });
      const res = await acceptProposal(proposalId, userId);
      if (res.data.status === 'Success') {
        setReceivedNotifs(prev =>
          prev.map(n => n.id === proposalId ? { ...n, status: 'accepted' } : n)
        );
      } else {
        alert(res.data.result || 'Could not accept proposal.');
      }
  } catch (err) { console.error('[NOTIF] acceptProposal error:', err); }
  };

  // ─── Reject proposal ──────────────────────────────────────────────────────
  const handleReject = async (proposalId) => {
    try {
      // const res = await api.post('/rejectProposal', {
      //   proposal_id: proposalId,
      //   receiver_id: Number(userId)
      // });
      const res = await rejectProposal(proposalId, userId);
      if (res.data.status === 'Success') {
        setReceivedNotifs(prev =>
          prev.map(n => n.id === proposalId ? { ...n, status: 'rejected' } : n)
        );
      } else {
        alert(res.data.result || 'Could not reject proposal.');
      }
    } catch (err) { console.error('[NOTIF] rejectProposal error:', err); }
  };

  // ─── Format date ──────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch { return dateStr; }
  };

  // ─── Render: proposal RECEIVED by me (User 1 view) ───────────────────────
  // Shows: "John sent you a proposal" + Accept/Reject or status
  const renderReceivedItem = (n) => {
    const { id, sender_id,ufname, ulname, status, created_at } = n;
    const name = `${ufname || ''} ${ulname || ''}`.trim() || 'Someone';
    return (
      <li key={`recv-${id}`} style={itemStyle}>
        <p style={{ margin: '0 0 4px', fontSize: '13px' }}>
          {/* <a href="#" onClick={e => e.preventDefault()} style={{ color: '#a84040', fontWeight: 'bold' }}>
            {name}
          </a> */}
          <Link
  to={`/ProfileDetails/${sender_id}`}   // ← sender_id from the notification data
  onClick={() => setIsNotificationVisible(false)}  // ← closes bell dropdown
  style={{ color: '#a84040', fontWeight: 'bold', textDecoration: 'none' }}
>
  {name}
</Link>
          {' '}
          Has Send You Proposal
        </p>
        <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
          <i className="far fa-clock"></i> {formatDate(created_at)}
        </div>

        {status === 'pending' && (
          <div>
            <a href="#" className="btn" style={{ marginRight: '6px' }}
              onClick={(e) => { e.preventDefault(); handleAccept(id); }}>
              Accept
            </a>
            <a href="#" className="btn red"
              onClick={(e) => { e.preventDefault(); handleReject(id); }}>
              Reject
            </a>
          </div>
        )}
        {status === 'accepted' && (
          <div style={{ color: 'green', fontSize: '12px' }}>
            <i className="far fa-check-circle"></i> You have accepted proposal
          </div>
        )}
        {status === 'rejected' && (
          <div style={{ color: '#a84040', fontSize: '12px' }}>
            <i className="fas fa-times"></i> You have Rejected proposal
          </div>
        )}
      </li>
    );
  };

  // ─── Render: response to MY sent proposal (User 2 view) ──────────────────
  // Shows: "Jane accepted your proposal" OR "Jane rejected your proposal"
  const renderResponseItem = (n) => {
    const { id,receiver_id, ufname, ulname, response_status, created_at } = n;
    const name = `${ufname || ''} ${ulname || ''}`.trim() || 'Someone';
    const isAccepted = response_status === 'accepted';
    return (
      <li key={`resp-${id}`} style={itemStyle}>
        <p style={{ margin: '0 0 4px', fontSize: '13px' }}>
          {/* <a href="#" onClick={e => e.preventDefault()} style={{ color: '#a84040', fontWeight: 'bold' }}>
            {name}
          </a> */}
          <Link
  to={`/ProfileDetails/${receiver_id}`}  // ← receiver_id from the response data
  onClick={() => setIsNotificationVisible(false)}  // ← closes bell dropdown
  style={{ color: '#a84040', fontWeight: 'bold', textDecoration: 'none' }}
>
  {name}
</Link>
          {' '}
          {isAccepted ? 'Accepted your proposal 🎉' : 'Rejected your proposal'}
        </p>
        <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
          <i className="far fa-clock"></i> {formatDate(created_at)}
        </div>
        {isAccepted ? (
          <div style={{ color: 'green', fontSize: '12px' }}>
            <i className="far fa-check-circle"></i> Your proposal was accepted
          </div>
        ) : (
          <div style={{ color: '#a84040', fontSize: '12px' }}>
            <i className="fas fa-times"></i> Your proposal was rejected
          </div>
        )}
      </li>
    );
  };

  // ─── Merge + sort both lists by date descending ───────────────────────────
  const allNotifications = [
    ...receivedNotifs.map(n => ({ ...n, _type: 'received' })),
    ...responseNotifs.map(n => ({ ...n, _type: 'response' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // ─── Shared item style ────────────────────────────────────────────────────
  const itemStyle = {
    padding:      '10px 15px',
    borderBottom: '1px solid #f0f0f0',
    listStyle:    'none',
  };

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <>
      <div className="header-wrap" ref={headerRef}>
        <div className="container">
          <div className="row">

            <div className="col-lg-4 col-md-4">
              <div className="logo"> <Link to="/">
               
                  {/* <img src={profiles.logo} alt="Logo" /> */}
                  <img src={imageUrl("/uploads/gallery/telugu_sambandham_navbar_v14.png")} alt="Logo" />

               </Link>
              </div>
            </div>

            <div className="col-lg-3 col-md-5" >
           <div class="active-profile" style={{fontSize: '13px', lineHeight: '1.5', textAlign: 'center', margin: '0', padding: '0', whiteSpace: 'nowrap'}}>
  Trusted Matrimony 
  <span>For <strong style={{color: '#8B0000', fontSize: '14px', fontWeight: '700'}}>Viswabrahmin</strong></span>
  <span style={{display: 'block', letterSpacing: '3px', fontSize: '10px', color: '#888', textTransform: 'uppercase'}}>Community</span>
</div>
 

            </div>

            <div className="col-lg-5 col-md-3">
              <div className="usertoplinks">

                {/* Guest */}
                {!loginuser && (
                  <ul className="usernav">
                    <li style={usernavLiStyle}>
                      <Link to="/login"><i className="fas fa-sign-in-alt"></i> Login</Link>
                    </li>
                    <li style={usernavLiStyle}>
                      <Link to="/signup" className="reg">
                        <i className="far fa-user"></i> Signup
                      </Link>
                    </li>
                  </ul>
                )}

                {/* Logged in */}
                {loginuser && (
                  <ul className="usernav">

                    {/* ── Bell ── */}
                    <li style={usernavLiStyle} className="dropdown notification">
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); toggleNotification(); }}
                        className="nav-link dropdown-toggle"
                        style={{ position: 'relative', display: 'inline-block' }}
                      >
                        <i className="far fa-bell"></i>
                        {unreadCount > 0 && (
                          <span style={{
                            position: 'absolute', top: '-6px', right: '-10px',
                            background: '#a84040', color: '#fff', borderRadius: '50%',
                            fontSize: '10px', width: '18px', height: '18px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </a>

                      {/* Bell dropdown */}
                      <ul
                        className="dropdown-menu dropdown-menu-right animate slideIn"
                        style={{
                          display: isNotificationVisible ? 'block' : 'none',
                          minWidth: '300px', maxHeight: '450px', overflowY: 'auto',
                          padding: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          border: '1px solid #eee', borderRadius: '6px',
                        }}
                      >
                        {/* Title bar */}
                        <li style={{
                          padding: '10px 15px', fontWeight: 'bold', fontSize: '13px',
                          borderBottom: '2px solid #a84040', background: '#fafafa',
                          listStyle: 'none', display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <span>Notifications</span>
                          {unreadCount > 0 && (
                            <span style={{
                              background: '#a84040', color: '#fff',
                              borderRadius: '10px', padding: '2px 8px', fontSize: '11px',
                            }}>
                              {unreadCount} new
                            </span>
                          )}
                        </li>

                        {/* Loading */}
                        {notifLoading && (
                          <li style={{ padding: '15px', textAlign: 'center', color: '#888', listStyle: 'none' }}>
                            Loading...
                          </li>
                        )}

                        {/* Error */}
                        {!notifLoading && notifError && (
                          <li style={{ padding: '15px', textAlign: 'center', color: 'red', listStyle: 'none' }}>
                            {notifError}
                          </li>
                        )}

                        {/* Empty */}
                        {!notifLoading && !notifError && allNotifications.length === 0 && (
                          <li style={{ padding: '20px', textAlign: 'center', color: '#888', listStyle: 'none' }}>
                            <i className="far fa-bell" style={{ fontSize: '22px', display: 'block', marginBottom: '6px' }}></i>
                            No notifications yet.
                          </li>
                        )}

                        {/* All notifications merged and sorted by date */}
                        {!notifLoading && !notifError && allNotifications.map(n =>
                          n._type === 'received'
                            ? renderReceivedItem(n)
                            : renderResponseItem(n)
                        )}

                      </ul>
                    </li>

                    {/* ── User dropdown ── */}
                    <li style={usernavLiStyle} className="dropdown">
                      <a href="#" onClick={(e) => { e.preventDefault(); toggleDropdown(); }}
                        className="nav-link dropdown-toggle">
                        <i className="far fa-user"></i>{' '}
                        <span>{userDetails.ufname || 'Me'}</span>
                      </a>
                      <ul className="dropdown-menu dropdown-menu-right animate slideIn"
                        style={{ display: isDropdownVisible ? 'block' : 'none' }}>
                        <li className="userdet">
                          <img src={profilePic} alt="Profile" />
                          <span>{userDetails.ufname || 'User'}  MAT{userDetails.uid || '---'}</span>
                          
                          <Link to="/editprofile">
                            <i className="fas fa-user-edit"></i> Edit Profile
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link to="/dashboard" className="nav-link">
                            <i className="fas fa-tachometer-alt"></i> Dashboard
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link to="/addgallery" className="nav-link">
                            <i className="fas fa-images"></i> Gallery
                          </Link>
                        </li>
                        {/* <li className="nav-item">
                          <Link to="/profilesecurity" className="nav-link">
                            <i className="fas fa-lock"></i> Picture Privacy
                          </Link>
                        </li>
                        <li className="nav-item">
                          <a href="#" className="nav-link" onClick={e => e.preventDefault()}>
                            <i className="far fa-laugh-squint"></i> Happy Story
                          </a>
                        </li> */}
                        {/* <li className="nav-item">
                          
                          <Link to="/dashboard" className="nav-link">
                            <i className="fas fa-cube"></i> My Package
                          </Link>
                        </li> */}
                        {/* <li className="nav-item">
                          <a href="#" className="nav-link" onClick={e => e.preventDefault()}>
                            <i className="fas fa-history"></i> Payment History
                          </a>
                        </li> */}
                        {/* <li className="nav-item">
                          <Link to="/dashboard" className="nav-link"> 
                            <i className="far fa-envelope"></i> My Requests
                          </Link>
                        </li> */}
                        <li className="nav-item">
                          
                          <Link to="/changepassword" className="nav-link">  
                            <i className="fas fa-key"></i> Change Password
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link to="/closeaccount" className="nav-link">
                            <i className="fas fa-times"></i> Close My Account
                          </Link>
                        </li>
                        <li className="nav-item">
                          <a href="#" className="nav-link" onClick={logoutHandler}>
                            <i className="fas fa-sign-out-alt"></i> Logout
                          </a>
                        </li>
                      </ul>
                    </li>

                    {/* ── Language ── */}
                    <li style={usernavLiStyle} className="dropdown lang">
                      <a href="#" className="nav-link" onClick={e => e.preventDefault()}>
                        <i className="fas fa-globe"></i> <span></span>
                      </a>
                      <ul className="dropdown-menu dropdown-menu-right animate slideIn">
                        <li className="nav-item"><a href="#" className="nav-link">English</a></li>
                        <li className="nav-item"><a href="#" className="nav-link">Urdu</a></li>
                        <li className="nav-item"><a href="#" className="nav-link">Arabic</a></li>
                      </ul>
                    </li>

                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <a className="navbar-brand" href="#" onClick={e => e.preventDefault()}>
            {isActive ? "Menu" : ""}
          </a>
          <button onClick={() => setIsActive(p => !p)} className="navbar-toggler" type="button">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={isActive ? 'collapse navbar-collapse show' : 'collapse navbar-collapse'}>
            <ul className="navbar-nav mr-auto">
              <li className="nav-item">
                <Link to="/profiles" className="nav-link">Matches</Link>
              </li>
                {!loginuser && (  <li className="nav-item">
                <Link to="/login" className="nav-link">Advanced Search</Link>
              </li>)}
               {loginuser && (  <li className="nav-item">
                <Link to="/advancesearch" className="nav-link">Advanced Search</Link>
              </li>)}
               {loginuser && (  <li className="nav-item">
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
              </li>)}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
