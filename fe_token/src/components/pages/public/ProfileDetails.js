
// src/components/pages/public/ProfileDetails.js
import React, { useEffect, useState } from 'react';
import profilepics from '../../templates/ImagesLoader'; 
import { PhotoProvider, PhotoView } from 'react-photo-view';
import { useParams, useNavigate } from 'react-router-dom';

import { imageUrl } from '../../../utils/imageUrl';
import { fetchUserDetails, fetchUserGallery, getUserContactInfo } from '../../../services/userService';
import { getPublicProfile, getPublicGallery } from '../../../services/listingService';
import { 
  sendProposal, 
  getSentProposals, 
  getNotifications
} from '../../../services/proposalService';
import { sendMessage } from '../../../services/messageService';

const ProfileDetails = () => {
  const { uid }    = useParams();
  const navigate   = useNavigate();

  const [userDetails, setUserDetails] = useState({});
  const [profileImage, setProfileImage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gallerydata, setGalleryData] = useState([]);

  // ── Proposal state ────────────────────────────────────────────────────────
  const [proposalStatus,  setProposalStatus]  = useState('idle');
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposalDate,    setProposalDate]    = useState(null);

  // ── Message state ─────────────────────────────────────────────────────────
  const [messageStatus,  setMessageStatus]  = useState('idle');
  const [messageText,    setMessageText]    = useState('');
  const [messageDate,    setMessageDate]    = useState(null);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [showPicRequestModal,      setShowPicRequestModal]      = useState(false);
  const [showContactDetailsModal,  setShowContactDetailsModal]  = useState(false);

  // ── Contact details state ─────────────────────────────────────────────────
  const [contactInfo,     setContactInfo]     = useState(null);
  const [contactLoading,  setContactLoading]  = useState(false);
  const [contactError,    setContactError]    = useState('');
  const [contactRevealed, setContactRevealed] = useState(false);

  const loggedInUserId = localStorage.getItem("userId");

  // ── Scroll to top on mount ────────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // ── Reset contact state when profile changes ──────────────────────────────
  useEffect(() => {
    setContactInfo(null);
    setContactRevealed(false);
    setContactError('');
  }, [uid]);

  // ── Fetch profile details + gallery ──────────────────────────────────────
  useEffect(() => {
    if (!uid) return;

    const loadProfileData = async () => {
      try {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const myGender   = localStorage.getItem('userGender'); // 'Male' or 'Female'

        if (isLoggedIn) {
          const response    = await fetchUserDetails(uid);
          const fetchimage  = await fetchUserGallery(uid);
          const profileData = response.data;

          // ── Gender Guard ────────────────────────────────────────────────
          // Logged-in users can only view opposite gender profiles.
          // Own profile is always allowed.
          // If same gender → redirect to /profiles.
          if (profileData && myGender) {
            const profileGender = profileData.ugender;
            const isOwnProfile  = String(profileData.uid) === String(loggedInUserId);
            const isSameGender  = profileGender === myGender;

            if (isSameGender && !isOwnProfile) {
              navigate('/profiles');
              return;
            }
          }
          // ── End Gender Guard ─────────────────────────────────────────────

          const profileImg = fetchimage.data.find(item => item.isprofile === true);
          setProfileImage(profileImg ? profileImg.imagepath : profilepics.notfound);
          setUserDetails(profileData);

        } else {
          // Guest — no gender restriction, use public endpoints
          const response   = await getPublicProfile(uid);
          const fetchimage = await getPublicGallery(uid);
          const profileImg = Array.isArray(fetchimage.data)
            ? fetchimage.data.find(item => item.isprofile === true)
            : null;
          setProfileImage(profileImg ? profileImg.imagepath : profilepics.notfound);
          setUserDetails(response.data.data || {});
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    const loadGalleryData = async () => {
      try {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const resp = isLoggedIn
          ? await fetchUserGallery(uid)
          : await getPublicGallery(uid);
        setGalleryData(Array.isArray(resp.data) ? resp.data : []);
      } catch (error) {
        console.log(error);
      }
    };

    loadProfileData();
    loadGalleryData();
  }, [uid]);

  // ── Check proposal status ─────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const checkBothDirections = async () => {
      if (!loggedInUserId || !uid) return;
      if (String(loggedInUserId) === String(uid)) return;
      try {
        const [sentRes, receivedRes] = await Promise.all([
          getSentProposals(loggedInUserId),
          getNotifications(loggedInUserId)
        ]);
        if (!isMounted) return;
        if (sentRes.data.status === 'Success' && sentRes.data.data?.length > 0) {
          const iSent = sentRes.data.data.find(p => String(p.receiver_id) === String(uid));
          if (iSent) {
            if (iSent.status === 'pending')  { setProposalStatus('i_sent');     setProposalDate(iSent.created_at); return; }
            if (iSent.status === 'accepted') { setProposalStatus('i_accepted'); setProposalDate(iSent.created_at); return; }
            if (iSent.status === 'rejected') { setProposalStatus('i_rejected'); setProposalDate(iSent.created_at); return; }
          }
        }
        if (receivedRes.data.status === 'Success' && receivedRes.data.data?.length > 0) {
          const theySent = receivedRes.data.data.find(n => String(n.sender_id) === String(uid));
          if (theySent) { setProposalStatus('they_sent'); setProposalDate(theySent.created_at); return; }
        }
        setProposalStatus('idle');
      } catch (err) {
        if (isMounted) { console.error('[PROPOSAL] error:', err); setProposalStatus('idle'); }
      }
    };
    checkBothDirections();
    return () => { isMounted = false; };
  }, [loggedInUserId, uid]);

  // ── Fetch Contact Info from API ───────────────────────────────────────────
  const handleRevealContact = async () => {
    if (!loggedInUserId) return;
    setContactLoading(true);
    setContactError('');
    try {
      const response = await getUserContactInfo(uid);
      if (response.data.status === 'Success') {
        setContactInfo(response.data.data);
        setContactRevealed(true);
      } else {
        setContactError(response.data.result || 'Failed to fetch contact details.');
      }
    } catch (err) {
      console.error('[CONTACT] error:', err);
      setContactError('Something went wrong. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  // ── Age Calculator ────────────────────────────────────────────────────────
  const birthDate = userDetails.udob;
  const age = calculateAge(birthDate);
  function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff   = today.getDate()  - birth.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) { age--; }
    return age;
  }

  // ── Send Proposal Handler ─────────────────────────────────────────────────
  const handleSendProposal = async () => {
    if (!loggedInUserId) { alert('Please login to send a proposal.'); return; }
    if (String(loggedInUserId) === String(uid)) { alert('You cannot send a proposal to your own profile.'); return; }
    setProposalStatus('sending');
    setProposalMessage('');
    try {
      const response = await sendProposal(loggedInUserId, uid);
      if (response.data.status === 'Success') {
        setProposalStatus('i_sent');
        setProposalMessage('Proposal sent successfully!');
      } else if (response.data.result === 'Proposal already sent.') {
        setProposalStatus('i_sent');
        setProposalMessage('You have already sent a proposal to this profile.');
      } else {
        setProposalStatus('error');
        setProposalMessage(response.data.result || 'Failed to send proposal.');
      }
    } catch (error) {
      console.error('[PROPOSAL] error:', error);
      setProposalStatus('error');
      setProposalMessage('Something went wrong. Please try again.');
    }
  };

  // ── Send Message Handler ──────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!loggedInUserId) { alert('Please login to send a message.'); return; }
    if (String(loggedInUserId) === String(uid)) { alert('You cannot send a message to your own profile.'); return; }
    setMessageStatus('sending');
    setMessageText('');
    const defaultMsg = `Hi ${userDetails.ufname}, I liked your profile. Let's discuss further if it matches.`;
    try {
      const response = await sendMessage(loggedInUserId, uid, defaultMsg, 'text');
      if (response.data.status === 'Success') {
        setMessageStatus('sent');
        setMessageText('Message sent successfully!');
        setMessageDate(new Date().toISOString());
      } else {
        setMessageStatus('error');
        setMessageText(response.data.result || 'Failed to send message.');
      }
    } catch (error) {
      console.error('[MESSAGE] error:', error);
      setMessageStatus('error');
      setMessageText('Something went wrong. Please try again.');
    }
  };

  // ── Proposal Helpers ──────────────────────────────────────────────────────
  const anchorLabel = () => {
    if (proposalStatus === 'sending')    return '⏳ Sending...';
    if (proposalStatus === 'i_sent')     return '✓ Proposal Sent';
    if (proposalStatus === 'i_accepted') return '✅ Proposal Accepted';
    if (proposalStatus === 'i_rejected') return '✗ Proposal Rejected';
    if (proposalStatus === 'they_sent')  return '📩 Proposal Received';
    if (proposalStatus === 'error')      return '❌ Retry Send Proposal';
    return 'Send Proposal';
  };
  const anchorStyle = () => {
    if (proposalStatus === 'i_accepted') return { color: 'green',   fontWeight: 'bold', cursor: 'default' };
    if (proposalStatus === 'i_rejected') return { color: '#a84040', fontWeight: 'bold', cursor: 'default' };
    if (proposalStatus === 'i_sent')     return { color: '#888',    fontWeight: 'bold', cursor: 'default' };
    if (proposalStatus === 'they_sent')  return { color: '#f57f17', fontWeight: 'bold', cursor: 'default' };
    if (proposalStatus === 'error')      return { color: 'red' };
    return {};
  };
  const proposalButtonLabel = () => {
    if (proposalStatus === 'sending')    return '⏳ Sending...';
    if (proposalStatus === 'i_sent')     return '✓ Proposal Sent';
    if (proposalStatus === 'i_accepted') return '✅ Accepted';
    if (proposalStatus === 'i_rejected') return '✗ Rejected';
    if (proposalStatus === 'they_sent')  return 'Cannot Send — You Received a Proposal';
    return 'Send';
  };
  const proposalButtonDisabled =
    proposalStatus === 'sending'    || proposalStatus === 'i_sent' ||
    proposalStatus === 'i_accepted' || proposalStatus === 'i_rejected' ||
    proposalStatus === 'they_sent';
  const canOpenModal = proposalStatus === 'idle' || proposalStatus === 'error';

  // ── Message Helpers ───────────────────────────────────────────────────────
  const messageAnchorLabel = () => {
    if (messageStatus === 'sending') return '⏳ Sending...';
    if (messageStatus === 'sent')    return '✓ Message Sent';
    if (messageStatus === 'error')   return '❌ Retry';
    return 'Send Message';
  };
  const messageAnchorStyle = () => {
    if (messageStatus === 'sent')  return { color: '#4CAF50', fontWeight: 'bold', cursor: 'default' };
    if (messageStatus === 'error') return { color: 'red' };
    return {};
  };
  const messageButtonLabel = () => {
    if (messageStatus === 'sending') return '⏳ Sending...';
    if (messageStatus === 'sent')    return '✓ Sent';
    if (messageStatus === 'error')   return 'Retry';
    return 'Send';
  };
  const messageButtonDisabled = messageStatus === 'sending' || messageStatus === 'sent';
  const canOpenMessageModal   = messageStatus === 'idle'    || messageStatus === 'error';

  // ── Date Formatter ────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d    = new Date(dateStr);
      const dd   = String(d.getDate()).padStart(2, '0');
      const mm   = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch { return ''; }
  };

  // ── Heading Helpers ───────────────────────────────────────────────────────
  const headingText = () => {
    const date = proposalDate ? formatDate(proposalDate) : '';
    if (proposalStatus === 'i_sent')     return date ? `Proposal Sent on ${date}`        : 'Proposal Sent — Awaiting Response';
    if (proposalStatus === 'i_accepted') return date ? `✅ Proposal Accepted on ${date}` : '✅ Proposal Accepted';
    if (proposalStatus === 'i_rejected') return date ? `✗ Proposal Rejected on ${date}`  : '✗ Proposal Rejected';
    if (proposalStatus === 'they_sent')  return date ? `📩 Proposal Received on ${date}` : '📩 Proposal Received';
    return 'Profile Details';
  };
  const headingStyle = () => {
    if (proposalStatus === 'i_accepted') return { color: '#ffffff', background: 'rgba(0,128,0,0.5)',     padding: '4px 12px', borderRadius: '4px', display: 'inline-block' };
    if (proposalStatus === 'i_rejected') return { color: '#ffffff', background: 'rgba(203,3,128,0.5)',   padding: '4px 12px', borderRadius: '4px', display: 'inline-block' };
    if (proposalStatus === 'they_sent')  return { color: '#ffffff', background: 'rgba(245,127,23,0.5)',  padding: '4px 12px', borderRadius: '4px', display: 'inline-block' };
    if (proposalStatus === 'i_sent')     return { color: '#ffffff', background: 'rgba(100,100,100,0.4)', padding: '4px 12px', borderRadius: '4px', display: 'inline-block' };
    return {};
  };

  // ── Shared modal styles ───────────────────────────────────────────────────
  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  };
  const modalBoxStyle = {
    background: '#fff', borderRadius: '8px',
    width: '90%', maxWidth: '500px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  };
  const modalHeaderStyle = {
    padding: '15px 20px', borderBottom: '1px solid #dee2e6',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  };
  const closeBtnStyle = {
    background: 'none', border: 'none', fontSize: '20px',
    cursor: 'pointer', color: '#666', lineHeight: 1
  };

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <>
      {/* Inner Heading */}
      <div className="inner-heading" style={{ backgroundImage: `url(${profilepics.titlebg})` }}>
        <div className="container">
          <h3 style={headingStyle()}>{headingText()}</h3>
        </div>
      </div>

      {/* Inner Content */}
      <div className="inner-content">
        <div className="container">
          <div className="userdetailbox">
            <div className="row">
              <div className="col-lg-2 col-md-3">
                <div className="profile-picture">
                  <div className="mx-auto profile-radius">
                    <div className="profile_img">
                      <PhotoProvider>
                        <PhotoView src={imageUrl(profileImage)}>
                          <img src={imageUrl(profileImage)} alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', aspectRatio: '1 / 1.2', cursor: 'pointer' }} />
                        </PhotoView>
                      </PhotoProvider>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-10 col-md-9">
                <h3 className="user-name">{userDetails.ufname} Profile</h3>
                <ul>
                  <li><span>Profile Id </span>: MAT{userDetails.uid}</li>
                  <li><span>Age </span>: {age} Years</li>
                  <li><span>Height</span>: {userDetails.uheight || 'Not Available'} Feet</li>
                  <li><span>Marital Status</span>: {userDetails.maritalstatus || 'Not Available'}</li>
                  <li><i className="fas fa-map-marker-alt"></i> {userDetails.upresentloc || 'Not Available'},{userDetails.ustate}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="usertabls">
            <ul>
              {localStorage.getItem('isLoggedIn') === 'true' ? (
                <>
                  <li>
                    <a href="#"
                      style={anchorStyle()}
                      data-toggle={canOpenModal ? 'modal' : undefined}
                      data-target={canOpenModal ? '#sendproposal' : undefined}
                      onClick={handleSendProposal}>
                      <i className="far fa-heart"></i> {anchorLabel()}
                    </a>
                  </li>
                  <li>
                    <a href="#"
                      style={messageAnchorStyle()}
                      data-toggle={canOpenMessageModal ? 'modal' : undefined}
                      data-target={canOpenMessageModal ? '#sendmessage' : undefined}
                      onClick={handleSendMessage}>
                      <i className="far fa-comment"></i> {messageAnchorLabel()}
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <a href="/login" style={{ color: '#a84040' }}>
                      <i className="far fa-heart"></i> 🔒 Login to Send Proposal
                    </a>
                  </li>
                  <li>
                    <a href="/login" style={{ color: '#a84040' }}>
                      <i className="far fa-comment"></i> 🔒 Login to Send Message
                    </a>
                  </li>
                </>
              )}
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); setShowContactDetailsModal(true); }}>
                  <i className="far fa-star"></i> View Contact Details
                </a>
              </li>
              <li><a href="#"><i className="far fa-envelope"></i> Report this profile Fake</a></li>
            </ul>
          </div>

          {/* Profile Content */}
          <div className="profile-Wrap">
            <div className="row">
              <div className="col-lg-4 col-md-4">
                <div className="introbox">
                  <h4>Introduction</h4>
                  <p>{userDetails.about || 'Not Available'}</p>
                </div>
                <div className="hiddengal">
                  <h3>Gallery Hidden</h3>
                  <p>Photos are Hidden by user, if you are interested in this profile then send request to unlock for you.</p>
                  <div className="viewbtn">
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowPicRequestModal(true); }}>
                      Request For Pictures
                    </a>
                  </div>
                </div>
                <div className="authorgallery">
                  <h2>Gallery</h2>
                  {gallerydata.length > 0 ? (
                    <PhotoProvider index={currentIndex} onIndexChange={setCurrentIndex}>
                      <div className="row">
                        {gallerydata.map((res, idx) => (
                          <div className="col-lg-4 col-md-6 col-6" key={res.id}>
                            <div className="work_item">
                              <div className="work">
                                <PhotoView src={imageUrl(res.imagepath)}>
                                  <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setCurrentIndex(idx)}>
                                    <img
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', aspectRatio: '1 / 1.2' }}
                                      src={imageUrl(res.imagepath)} alt="Profile Gallery" />
                                    <div className="caption"><div className="caption-box"><i className="fas fa-plus"></i></div></div>
                                  </div>
                                </PhotoView>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PhotoProvider>
                  ) : (
                    <div className="hiddengal">
                      <h3>Request for Photos/Gallery</h3>
                      <p>No gallery or profile pictures have been added by this user.</p>
                      <div className="viewbtn">
                        <a href="#" onClick={(e) => { e.preventDefault(); setShowPicRequestModal(true); }}>
                          Request Photos
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <div className="google-add"><img src={profilepics.gad3} alt="" /></div>
              </div>

              <div className="col-lg-8 col-md-8">
                <div className="viewpage">
                  <ul className="nav nav-tabs profiletabs" id="usertabs" role="tablist">
                    <li className="nav-item">
                      <a className="nav-link active" id="overview-tab" data-toggle="tab" href="#overview" role="tab">
                        About {userDetails.ufname}
                      </a>
                    </li>
                  </ul>
                  <div className="tab-content userinfotabs" id="usertabsContent">
                    <div className="tab-pane fade show active" id="overview" role="tabpanel">

                      {/* General Overview */}
                      <div className="info-box">
                        <div className="header"><h4 className="title">General Overview</h4></div>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="content"><ul className="infolist">
                              <li><span>FIRST NAME</span><span className="user-name">{userDetails.ufname || 'Not Available'}</span></li>
                              <li><span>GENDER</span><span >{userDetails.ugender || 'Not Available'}</span></li>
                              <li><span>AGE</span><span>{age}</span></li>
                              <li><span>ON BEHALF</span><span>{userDetails.ucreated || 'Not Available'}</span></li>
                              <li><span>DATE OF BIRTH</span><span>{userDetails.udob ? (userDetails.udob).split("/")[1]+'/'+(userDetails.udob).split("/")[0]+'/'+(userDetails.udob).split("/")[2] : 'Not Available'}</span></li>
                              <li><span>PLACE OF BIRTH</span><span>{userDetails.upob || 'Not Available'}</span></li>
                            </ul></div>
                          </div>
                          <div className="col-md-6">
                            <div className="content"><ul className="infolist">
                              <li><span>LAST NAME</span><span className="user-name">{userDetails.ulname || 'Not Available'}</span></li>
                              <li><span>EMAIL</span><span>{userDetails.uemail || 'Not Available'}</span></li>
                              <li><span>HEIGHT</span><span>{userDetails.uheight || 'Not Available'} Feet</span></li>
                              <li><span>MARITAL STATUS</span><span>{userDetails.maritalstatus || 'Not Available'}</span></li>
                              <li><span>TIME OF BIRTH</span><span>{userDetails.utob || 'Not Available'}</span></li>
                            </ul></div>
                          </div>
                        </div>
                      </div>

                      {/* Horoscope */}
                      <div className="info-box">
                        <div className="header"><h4 className="title">Horoscope Details</h4></div>
                        <div className="row">
                          <div className="col-md-6"><div className="content"><ul className="infolist">
                            <li><span>Nakshtra</span><span>{userDetails.nakshtra || 'Not Available'}</span></li>
                            <li><span>RASI</span><span>{userDetails.rasi || 'Not Available'}</span></li>
                          </ul></div></div>
                          <div className="col-md-6"><div className="content"><ul className="infolist">
                            <li><span>PADAM</span><span>{userDetails.padam || 'Not Available'}</span></li>
                          </ul></div></div>
                        </div>
                      </div>

                      {/* Living at */}
                      <div className="info-box">
                        <div className="header"><h4 className="title">Living at</h4></div>
                        <div className="row">
                          <div className="col-md-6"><div className="content"><ul className="infolist">
                            <li><span>COUNTRY</span><span>{userDetails.ucountry || 'Not Available'}</span></li>
                            <li><span>CITY</span><span>{userDetails.upresentloc || 'Not Available'}</span></li>
                          </ul></div></div>
                          <div className="col-md-6"><div className="content"><ul className="infolist">
                            <li><span>STATE</span><span>{userDetails.ustate || 'Not Available'}</span></li>
                          </ul></div></div>
                        </div>
                      </div>

                      {/* Qualification */}
                      <div className="info-box">
                        <div className="header"><h4 className="title">Qualification And Career</h4></div>
                        <div className="row">
                          <div className="col-md-6"><div className="content"><ul className="infolist">
                            <li><span>HIGHEST EDUCATION</span><span>{userDetails.degree || 'Not Available'}</span></li>
                            <li><span>ANNUAL INCOME</span><span>{userDetails.upackage || 'Not Available'}</span></li>
                          </ul></div></div>
                          <div className="col-md-6"><div className="content"><ul className="infolist">
                            <li><span>OCCUPATION</span><span>{userDetails.ujob || 'Not Available'}</span></li>
                            <li><span>JOB LOCATION</span><span>{userDetails.jobcity || 'Not Available'}</span></li>
                          </ul></div></div>
                        </div>
                      </div>

                      {/* Family Background */}
                      <div className="info-box">
                        <div className="header"><h4 className="title">Family Background</h4></div>
                        <div className="row">
                          <div className="col-md-6"><div className="content"><ul className="infolist">
                            <li><span>FATHER NAME</span><span className="user-name">{userDetails.fathername || 'Not Available'}</span></li>
                            <li><span>MOTHER NAME</span><span className="user-name">{userDetails.mothername || 'Not Available'}</span></li>
                            <li><span>BROTHERS</span><span>{userDetails.brothers || 'Not Available'}</span></li>
                            <li><span>SISTERS</span><span>{userDetails.sisters || 'Not Available'}</span></li>
                            <li><span>CASTE</span><span>{userDetails.ucaste || 'Not Available'}</span></li>
                          </ul></div></div>
                          <div className="col-md-6"><div className="content"><ul className="infolist">
                            <li><span>FATHER OCCUPATION</span><span>{userDetails.fatheroccupation || 'Not Available'}</span></li>
                            <li><span>MOTHER OCCUPATION</span><span>{userDetails.motheroccupation || 'Not Available'}</span></li>
                            <li><span>BROTHERS MARRIED</span><span>{userDetails.brothersmarried || 'Not Available'}</span></li>
                            <li><span>SISTERS MARRIED</span><span>{userDetails.sistersmarried || 'Not Available'}</span></li>
                            <li><span>FAMILY RESIDENCE</span><span>{userDetails.familyresidence || 'Not Available'}</span></li>
                          </ul></div></div>
                        </div>
                      </div>

                      {/* Life Style */}
                      <div className="info-box">
                        <div className="header"><h4 className="title">Life Style</h4></div>
                        <div className="row">
                          <div className="col-md-6"><div className="content"><ul className="infolist">
                            <li><span>DIET</span><span>{userDetails.diet || 'Not Available'}</span></li>
                            <li><span>SMOKE</span><span>{userDetails.habitsmoke || 'Not Available'}</span></li>
                          </ul></div></div>
                          <div className="col-md-6"><div className="content"><ul className="infolist">
                            <li><span>DRINK</span><span>{userDetails.habitdrink || 'Not Available'}</span></li>
                          </ul></div></div>
                        </div>
                      </div>

                      {/* Partner Preferences */}
                      <div className="info-box">
                        <div className="header"><h4 className="title">Partner Preferences</h4></div>
                        <div className="row"><div className="col-md-12"><div className="content"><ul className="infolist">
                          <li><span>{userDetails.partnerpreferences || 'Not Available'}</span></li>
                        </ul></div></div></div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="google-add"><img src={profilepics.googleadd} alt="" /></div>
          </div>
        </div>
      </div>

      {/* ── Pic Request Modal ──────────────────────────────────────────────────── */}
      {showPicRequestModal && (
        <div style={overlayStyle} onClick={() => setShowPicRequestModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h5 style={{ margin: 0 }}>Request Unlock Photos</h5>
              <button onClick={() => setShowPicRequestModal(false)} style={closeBtnStyle}>&times;</button>
            </div>
            <div style={{ padding: '20px' }}>
              <p>Sending Gallery Request will deduct <strong>1 credit</strong> from your package.</p>
              {localStorage.getItem('isLoggedIn') === 'true' ? (
                <div className="viewbtn">
                  <a href="#" onClick={(e) => { e.preventDefault(); setShowPicRequestModal(false); alert('Request sent successfully!'); }}>
                    Send Request
                  </a>
                </div>
              ) : (
                <div className="viewbtn"><a href="/login">Login to Send Request</a></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Contact Details Modal ──────────────────────────────────────────────── */}
      {showContactDetailsModal && (
        <div style={overlayStyle} onClick={() => setShowContactDetailsModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h5 style={{ margin: 0 }}>
                <i className="far fa-address-card" style={{ marginRight: '8px', color: '#a84040' }}></i>
                Contact Details — {userDetails.ufname}
              </h5>
              <button onClick={() => setShowContactDetailsModal(false)} style={closeBtnStyle}>&times;</button>
            </div>
            <div style={{ padding: '20px' }}>

              {/* Not logged in */}
              {localStorage.getItem('isLoggedIn') !== 'true' && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666', marginBottom: '16px' }}>Please login to view contact details.</p>
                  <div className="viewbtn"><a href="/login">Login Now</a></div>
                </div>
              )}

              {/* Logged in — before revealing */}
              {localStorage.getItem('isLoggedIn') === 'true' && !contactRevealed && (
                <>
                  <p style={{ marginBottom: '12px', color: '#444' }}>
                    Viewing contact details will deduct <strong><del>₹20</del></strong> from your balance.
                    Click <strong><del>Pay Now</del></strong> to reveal the phone number and email address.
                  </p>
                  {contactError && (
                    <div style={{ background: '#fdecea', border: '1px solid #f44336', borderRadius: '6px', padding: '10px 14px', color: '#c62828', marginBottom: '12px', fontSize: '14px' }}>
                      <i className="fas fa-times-circle" style={{ marginRight: '6px' }}></i>
                      {contactError}
                    </div>
                  )}
                  <div className="viewbtn">
                    <a href="#"
                      onClick={(e) => { e.preventDefault(); handleRevealContact(); }}
                      style={{ opacity: contactLoading ? 0.6 : 1, cursor: contactLoading ? 'not-allowed' : 'pointer' }}>
                      {contactLoading ? '⏳ Loading...' : '💳 Unlock Contact (Free)'}
                    </a>
                  </div>
                </>
              )}

              {/* Logged in — after revealing */}
              {localStorage.getItem('isLoggedIn') === 'true' && contactRevealed && contactInfo && (
                <>
                  <div style={{ background: '#e6f9ee', border: '1px solid #4CAF50', borderRadius: '6px', padding: '10px 14px', color: '#2e7d32', marginBottom: '16px', fontSize: '14px' }}>
                    <i className="far fa-check-circle" style={{ marginRight: '6px' }}></i>
                    Contact details revealed.
                  </div>
                  <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', padding: '16px' }}>
                    <h6 style={{ color: '#a84040', marginBottom: '14px', fontWeight: 'bold', fontSize: '14px' }}>
                      <i className="far fa-user" style={{ marginRight: '6px' }}></i>
                      {userDetails.ufname} {userDetails.ulname} — Contact Information
                    </h6>

                    {/* Phone */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', padding: '10px 14px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px' }}>
                      <div style={{ width: '36px', height: '36px', background: '#a84040', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', flexShrink: 0 }}>
                        <i className="fas fa-phone" style={{ color: '#fff', fontSize: '14px' }}></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>PHONE NUMBER</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', letterSpacing: '0.5px' }}>
                          {contactInfo.uphone
                            ? contactInfo.uphone
                            : <em style={{ color: '#999', fontWeight: 'normal', fontSize: '14px' }}>Mobile number is hidden by user</em>
                          }
                        </div>
                      </div>
                      {contactInfo.uphone && (
                        <a href={`tel:${contactInfo.uphone}`}
                          style={{ marginLeft: 'auto', background: '#a84040', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', textDecoration: 'none' }}>
                          Call Now
                        </a>
                      )}
                    </div>

                    {/* Email */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px' }}>
                      <div style={{ width: '36px', height: '36px', background: '#7c3aed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', flexShrink: 0 }}>
                        <i className="far fa-envelope" style={{ color: '#fff', fontSize: '14px' }}></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>EMAIL ADDRESS</div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
                          {contactInfo.uemail
                            ? contactInfo.uemail
                            : <em style={{ color: '#999', fontWeight: 'normal', fontSize: '14px' }}>Email is hidden by user</em>
                          }
                        </div>
                      </div>
                      {contactInfo.uemail && (
                        <a href={`mailto:${contactInfo.uemail}`}
                          style={{ marginLeft: 'auto', background: '#7c3aed', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', textDecoration: 'none' }}>
                          Email Now
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: '14px', textAlign: 'center' }}>
                    <button
                      onClick={() => setShowContactDetailsModal(false)}
                      style={{ background: '#a84040', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px' }}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Send Proposal Modal ───────────────────────────────────────────────── */}
      <div className="modal fade" id="sendproposal" tabIndex="-1" role="dialog" aria-labelledby="proposalLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="proposalLabel">Send Proposal to {userDetails.ufname}</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            </div>
            <div className="modal-body">
              <div className="popfield">
                {proposalStatus === 'they_sent' && (
                  <div style={{ background: '#e8f4fd', border: '1px solid #2196F3', borderRadius: '6px', padding: '10px 14px', color: '#0d47a1', marginBottom: '12px', fontSize: '14px' }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                    {userDetails.ufname} has already sent you a proposal. Please accept or reject it from your notification bell 🔔.
                  </div>
                )}
                {proposalStatus === 'i_sent' && proposalMessage === 'Proposal sent successfully!' && (
                  <div style={{ background: '#e6f9ee', border: '1px solid #4CAF50', borderRadius: '6px', padding: '10px 14px', color: '#2e7d32', marginBottom: '12px', fontSize: '14px' }}>
                    <i className="far fa-check-circle" style={{ marginRight: '6px' }}></i>
                    Proposal sent successfully to {userDetails.ufname}! Waiting for response.
                  </div>
                )}
                {proposalStatus === 'i_sent' && proposalMessage !== 'Proposal sent successfully!' && (
                  <div style={{ background: '#fff8e1', border: '1px solid #FFC107', borderRadius: '6px', padding: '10px 14px', color: '#f57f17', marginBottom: '12px', fontSize: '14px' }}>
                    <i className="fas fa-clock" style={{ marginRight: '6px' }}></i>
                    Your proposal is pending. Waiting for {userDetails.ufname} to respond.
                  </div>
                )}
                {proposalStatus === 'i_accepted' && (
                  <div style={{ background: '#e6f9ee', border: '1px solid #4CAF50', borderRadius: '6px', padding: '10px 14px', color: '#2e7d32', marginBottom: '12px', fontSize: '14px' }}>
                    <i className="far fa-check-circle" style={{ marginRight: '6px' }}></i>
                    🎉 {userDetails.ufname} has accepted your proposal!
                  </div>
                )}
                {proposalStatus === 'i_rejected' && (
                  <div style={{ background: '#fdecea', border: '1px solid #f44336', borderRadius: '6px', padding: '10px 14px', color: '#c62828', marginBottom: '12px', fontSize: '14px' }}>
                    <i className="fas fa-times-circle" style={{ marginRight: '6px' }}></i>
                    {userDetails.ufname} has rejected your proposal.
                  </div>
                )}
                {proposalStatus === 'error' && (
                  <div style={{ background: '#fdecea', border: '1px solid #f44336', borderRadius: '6px', padding: '10px 14px', color: '#c62828', marginBottom: '12px', fontSize: '14px' }}>
                    <i className="fas fa-times-circle" style={{ marginRight: '6px' }}></i>
                    {proposalMessage}
                  </div>
                )}
                {(proposalStatus === 'idle' || proposalStatus === 'sending') && (
                  <p>Sending Proposal will deduct <strong>1 credit</strong> from your package.</p>
                )}
                <div className="fldrw" style={{ marginTop: '10px' }}>
                  <input type="button" value={proposalButtonLabel()} className="btn default-btn"
                    onClick={handleSendProposal} disabled={proposalButtonDisabled}
                    style={{ opacity: proposalButtonDisabled ? 0.6 : 1, cursor: proposalButtonDisabled ? 'not-allowed' : 'pointer' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Send Message Modal ────────────────────────────────────────────────── */}
      <div className="modal fade" id="sendmessage" tabIndex="-1" role="dialog" aria-labelledby="messageLabel" aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="messageLabel">Send Message to {userDetails.ufname}</h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            </div>
            <div className="modal-body">
              <div className="popfield">
                {messageStatus === 'sent' && (
                  <div style={{ background: '#e6f9ee', border: '1px solid #4CAF50', borderRadius: '6px', padding: '10px 14px', color: '#2e7d32', marginBottom: '12px', fontSize: '14px' }}>
                    <i className="far fa-check-circle" style={{ marginRight: '6px' }}></i>
                    Message sent successfully to {userDetails.ufname}!
                  </div>
                )}
                {messageStatus === 'error' && messageText && (
                  <div style={{ background: '#fdecea', border: '1px solid #f44336', borderRadius: '6px', padding: '10px 14px', color: '#c62828', marginBottom: '12px', fontSize: '14px' }}>
                    <i className="fas fa-times-circle" style={{ marginRight: '6px' }}></i>
                    {messageText}
                  </div>
                )}
                {(messageStatus === 'idle' || messageStatus === 'sending') && (
                  <>
                    <p style={{ marginBottom: '8px' }}>Sending Message will deduct <strong>1 credit</strong> from your package.</p>
                    <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px', padding: '12px', marginBottom: '12px', fontSize: '14px', color: '#495057' }}>
                      <strong style={{ display: 'block', marginBottom: '6px', color: '#6c757d' }}>
                        <i className="far fa-comment-alt" style={{ marginRight: '4px' }}></i>
                        Message Preview:
                      </strong>
                      Hi {userDetails.ufname}, I liked your profile. Let's discuss further if it matches.
                    </div>
                  </>
                )}
                <div className="fldrw" style={{ marginTop: '10px' }}>
                  <input type="button" value={messageButtonLabel()} className="btn default-btn"
                    onClick={handleSendMessage} disabled={messageButtonDisabled}
                    style={{ opacity: messageButtonDisabled ? 0.6 : 1, cursor: messageButtonDisabled ? 'not-allowed' : 'pointer' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileDetails;