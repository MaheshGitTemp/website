 

import React, { useEffect, useState, useContext, useRef } from 'react'
import Profiles from '../../../templates/ImagesLoader'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../../hooks/AuthContext';
import { fetchUserDetails, fetchUserGallery } from '../../../../services/userService';
import { getUnreadMessageCount } from '../../../../services/messageService';
import profilepics from '../../../templates/ImagesLoader';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { imageUrl } from '../../../../utils/imageUrl';

const Sidebar = () => {
  const navigate  = useNavigate();
  const { logout } = useContext(AuthContext);

  const [getGallery,     setGetGallery]     = useState([]);
  const [userDetails,    setUserDetails]    = useState([]);
  const [copied,         setCopied]         = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

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
      <div className="profileDetails">
        <h3><span className="user-name">{userDetails.ufname || 'user'}</span>'s Profile</h3>

        <div className="profile-picture">
          <div className="mx-auto profile-radius">
            <div className="profile_img">
              <PhotoProvider>
                {getGallery.length > 0 ? (
                  (() => {
                    const profileFile = getGallery.find(file => file.isprofile);
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

      <div className="editDetails" >
        <ul >
          <li><Link to="/dashboard"><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
          <li><Link to="/editprofile"><i className="fas fa-edit"></i> Edit Profile</Link></li>
          <li><Link to="/addgallery"><i className="fas fa-images"></i> Gallery</Link></li>
          <li>
            <Link to="/messages">
              <i className="far fa-comment"></i> Messages{' '}
              {unreadMessages > 0 && (
                <span className="badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
              )}
            </Link>
          </li>
          <li><Link to="/changepassword"><i className="fas fa-key"></i> Change Password</Link></li>
          <li>
            <Link to="/profilesecurity">
              <i className="fas fa-shield-alt"></i> Profile Security
            </Link>
          </li>
          <li>
            <Link to="/closeaccount">
              <i className="fas fa-times"></i> Close My Account
            </Link>
          </li>
          <li>
            <a href="#" onClick={logoutHandler} style={{ cursor: 'pointer' }}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </a>
          </li>
        </ul>
      </div>

      <div className="authorgallery">
        <h2>Gallery</h2>
        <PhotoProvider>
          <div className="row">
            {getGallery.map(res => (
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
    </div>
    </>
  );
};

export default Sidebar;