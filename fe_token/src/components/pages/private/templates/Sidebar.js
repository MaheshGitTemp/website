 

import React, { useEffect, useState, useContext, useRef } from 'react'
import Profiles from '../../../templates/ImagesLoader'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../../../hooks/AuthContext';
import { fetchUserDetails, fetchUserGallery } from '../../../../services/userService';
import { getUnreadMessageCount } from '../../../../services/messageService';
import profilepics from '../../../templates/ImagesLoader';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { imageUrl, approvedOnly, approvedProfileImage } from '../../../../utils/imageUrl';

const Sidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { logout } = useContext(AuthContext);

  const [getGallery,     setGetGallery]     = useState([]);
  const [userDetails,    setUserDetails]    = useState([]);
  const [copied,         setCopied]         = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // ── Mobile: collapsible sidebar nav ───────────────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Nav starts collapsed on mobile, always open on desktop.
  const [navOpen, setNavOpen] = useState(!(window.innerWidth < 768));
  // Keep nav shown on desktop even if the window is resized up from mobile.
  useEffect(() => { if (!isMobile) setNavOpen(true); }, [isMobile]);

  // Gallery section is shown everywhere on desktop, but on mobile only on the
  // Gallery page itself (/addgallery).
  const showGallerySection = !isMobile || location.pathname === '/addgallery';

  // Navigate to a tab, then scroll to the page's main content column so the user
  // lands focused on that section instead of at the top (behind the sidebar).
  const goToTab = (e, path) => {
    if (e) e.preventDefault();
    if (isMobile) setNavOpen(false); // collapse the menu after a selection
    navigate(path);
    // Let the destination render, then scroll its content column into view.
    setTimeout(() => {
      const content = document.querySelector('.profile-Wrap .col-lg-8');
      if (content) {
        content.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 150);
  };

  // ✅ stable userId — not recreated every render
  const userId     = React.useMemo(() => localStorage.getItem("userId"), []);
  // ✅ fetch-once guard — prevents StrictMode double-invoke and re-fetch on parent re-render
  const hasFetched = useRef(false);

  const logoutHandler = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  useEffect(() => {
    // ✅ Only fetch once — this is the key fix for repeated API calls
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchUserData = async () => {
      try {
        // ✅ All 3 calls in parallel — faster than sequential
        const [userDetailsRes, galleryRes, msgRes] = await Promise.all([
          fetchUserDetails(userId),
          fetchUserGallery(userId),
          getUnreadMessageCount(userId)
        ]);
        setUserDetails(userDetailsRes.data);
        setGetGallery(galleryRes.data);
        if (msgRes.data.status === 'Success') {
          setUnreadMessages(msgRes.data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Sidebar fetch error:', error);
      }
    };

    fetchUserData();
  }, []); // ✅ empty deps — runs exactly once on mount

  return (
    <>
    <div className="col-lg-4 col-md-4">
      {/* Profile card (name, photo, MAT id, phone, email, city/state) —
          hidden on mobile per request; shown on desktop. */}
      {!isMobile && (
      <div className="profileDetails">
        <h3><span className="user-name">{userDetails.ufname || 'user'}</span>'s Profile</h3>

        <div className="profile-picture">
          <div className="mx-auto profile-radius">
            <div className="profile_img">
              <PhotoProvider>
                {getGallery.length > 0 ? (
                  (() => {
                    const profileFile = approvedProfileImage(getGallery);
                    return profileFile ? (
                      // ✅ PhotoView src — original (full size for lightbox)
                      // ✅ img src      — medium (display in sidebar)
                      <PhotoView src={imageUrl(profileFile.imagepath)}>
                        <img
                          src={imageUrl(profileFile.imagepath_medium) || imageUrl(profileFile.imagepath)}
                          alt="Profile"
                          style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover', objectPosition: 'top',
                            aspectRatio: '1 / 1', cursor: 'pointer'
                          }}
                        />
                      </PhotoView>
                    ) : (
                      <img src={profilepics.notfound} alt="Default profile" />
                    );
                  })()
                ) : (
                  <img src={profilepics.notfound} alt="Default profile" />
                )}
              </PhotoProvider>
            </div>
          </div>
        </div>

        <div className="authorDetail">
          <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', color: '#333' }}>
            <span
              onClick={() => {
                const matId = `MAT${userDetails.uid || '---'}`;
                navigator.clipboard.writeText(matId).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              title="Click to copy"
              style={{
                background: 'linear-gradient(135deg, #be7e80 0%, #a84040 100%)',
                color: 'white', padding: '4px 14px', borderRadius: '20px',
                fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px',
                boxShadow: '0 1px 6px rgb(255,255,255)', cursor: 'pointer', userSelect: 'none'
              }}
            >
              {copied
                ? <><i className="fas fa-check" style={{ marginRight: '4px' }}></i>Copied!</>
                : <>MAT{userDetails.uid || '---'} <i className="far fa-copy" style={{ marginLeft: '4px', fontSize: '11px' }}></i></>
              }
            </span>
          </h2>
          <p><i className="fa fa-phone" aria-hidden="true"></i> {userDetails.uphone}</p>
          <p><i className="fa fa-envelope" aria-hidden="true"></i>{userDetails.uemail}</p>
          <p><i className="fas fa-map-marker-alt"></i>{userDetails.upresentloc ? userDetails.upresentloc : "Not Available"},{userDetails.ustate}</p>
        </div>
      </div>
      )}

      <div className="editDetails" >
        {/* Mobile-only collapse/expand toggle for the menu */}
        {isMobile && (
          <button
            type="button"
            onClick={() => setNavOpen(o => !o)}
            aria-expanded={navOpen}
            aria-label={navOpen ? 'Collapse menu' : 'Expand menu'}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '8px',
              padding: '12px 16px', background: '#a84040', color: '#fff',
              border: 'none', borderRadius: '6px', fontSize: '15px',
              fontWeight: 600, cursor: 'pointer', marginBottom: navOpen ? '10px' : 0
            }}
          >
            <span><i className="fas fa-bars" style={{ marginRight: '8px' }}></i> My Account</span>
            <i className={navOpen ? 'fas fa-chevron-up' : 'fas fa-chevron-down'}></i>
          </button>
        )}

        {navOpen && (
        <ul >
          <li><Link to="/dashboard" onClick={(e) => goToTab(e, '/dashboard')}><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
          <li><Link to="/editprofile" onClick={(e) => goToTab(e, '/editprofile')}><i className="fas fa-edit"></i> Edit Profile</Link></li>
          <li><Link to="/addgallery" onClick={(e) => goToTab(e, '/addgallery')}><i className="fas fa-images"></i> Gallery</Link></li>
          <li>
            <Link to="/messages" onClick={(e) => goToTab(e, '/messages')}>
              <i className="far fa-comment"></i> Messages{' '}
              {unreadMessages > 0 && (
                <span className="badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
              )}
            </Link>
          </li>
          <li><Link to="/changepassword" onClick={(e) => goToTab(e, '/changepassword')}><i className="fas fa-key"></i> Change Password</Link></li>
          <li>
            <Link to="/profilesecurity" onClick={(e) => goToTab(e, '/profilesecurity')}>
              <i className="fas fa-shield-alt"></i> Profile Security
            </Link>
          </li>
          <li>
            <Link to="/closeaccount" onClick={(e) => goToTab(e, '/closeaccount')}>
              <i className="fas fa-times"></i> Close My Account
            </Link>
          </li>
          <li>
            <a href="#" onClick={logoutHandler} style={{ cursor: 'pointer' }}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </a>
          </li>
        </ul>
        )}
      </div>

      {showGallerySection && (
      <div className="authorgallery">
        <h2>Gallery</h2>
        <PhotoProvider>
          <div className="row">
            {approvedOnly(getGallery).map(res => (
              <div className="col-lg-4 col-md-6 col-6" key={res.id}>
                <div className="work_item">
                  <div className="work">
                    {/* ✅ PhotoView src — original (full size for lightbox) */}
                    {/* ✅ img src      — thumb (150×150 for small gallery grid) */}
                    <PhotoView src={imageUrl(res.imagepath)}>
                      <div style={{ position: 'relative', cursor: 'pointer' }}>
                        <img
                          className="example-image"
                          src={imageUrl(res.imagepath_thumb) || imageUrl(res.imagepath)}
                          alt="Profile Gallery"
                          style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover', objectPosition: 'top',
                            aspectRatio: '1 / 1.3'
                          }}
                        />
                        <div className="caption">
                          <div className="caption-box"><i className="fas fa-plus"></i></div>
                        </div>
                      </div>
                    </PhotoView>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PhotoProvider>
      </div>
      )}
    </div>
    </>
  );
};

export default Sidebar;