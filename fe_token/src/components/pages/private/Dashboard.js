 

// src/components/pages/private/Dashboard.js
import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import Profiles from '../../templates/ImagesLoader';
import { Link } from 'react-router-dom';
import Sidebar from './templates/Sidebar';
import { fetchUserDetails } from '../../../services/userService';
import { AuthContext } from '../../hooks/AuthContext';
import {
  getNotifications,
  getSenderNotifications,
  getUnreadCount,
  acceptProposal,
  rejectProposal
} from '../../../services/proposalService';
import { getUnreadMessageCount, fetchInbox } from '../../../services/messageService';
import { imageUrl } from '../../../utils/imageUrl'; // profile pics now come from proposal query

const Dashboard = () => {
  const { loginuser } = useContext(AuthContext);
  // ✅ stable userId — not recreated every render
  const userId = React.useMemo(() => localStorage.getItem('userId'), []);

  // ── Notification state ────────────────────────────────────────────────────
  const [receivedNotifs,      setReceivedNotifs]      = useState([]);
  const [responseNotifs,      setResponseNotifs]      = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [actionLoading,       setActionLoading]       = useState(null);
  const [userName,            setUserName]            = useState('');
  const [activeTab,           setActiveTab]           = useState('received');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [totalNotifications,  setTotalNotifications]  = useState(0);
  const [unreadMessages,      setUnreadMessages]      = useState(0);
  const [totalMessages,       setTotalMessages]       = useState(0);
  const [profileImages,       setProfileImages]       = useState({});

  // ✅ fetch-once guard — prevents StrictMode double-invoke
  const hasFetched = useRef(false);

  // ── Fetch unread + total counts ───────────────────────────────────────────
  // ✅ empty deps — userId is stable (useMemo), no re-creation needed
  const fetchUnreadCounts = useCallback(async () => {
    if (!userId) return;
    try {
      const [msgUnreadRes, notifUnreadRes, inboxRes] = await Promise.all([
        getUnreadMessageCount(userId),
        getUnreadCount(userId),
        fetchInbox(userId)
      ]);
      if (msgUnreadRes.data.status === 'Success')
        setUnreadMessages(msgUnreadRes.data.unreadCount || 0);
      if (notifUnreadRes.data.status === 'Success')
        setUnreadNotifications(notifUnreadRes.data.unreadCount || 0);
      if (inboxRes.data.status === 'Success')
        setTotalMessages(Array.isArray(inboxRes.data.data) ? inboxRes.data.data.length : 0);
    } catch (err) {
      console.error('[DASHBOARD] fetchUnreadCounts error:', err);
    }
  }, []); // ✅ empty deps

  // ── Fetch all proposal notifications ─────────────────────────────────────
  // ✅ Profile pics now come from proposal query — no separate GetUserGallery calls
  const fetchAllNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [receivedRes, responseRes] = await Promise.all([
        getNotifications(userId),
        getSenderNotifications(userId)
      ]);
      const received = receivedRes.data.status === 'Success'
        ? (receivedRes.data.data || []) : [];
      const response = responseRes.data.status === 'Success'
        ? (responseRes.data.data || []) : [];

      setReceivedNotifs(received);
      setResponseNotifs(response);
      setTotalNotifications(received.length + response.length);

      // ✅ Build profileImages from data already returned — zero extra API calls
      const images = {};
      received.forEach(n => {
        images[n.sender_id] = imageUrl(n.sender_pic_thumb) 
          || imageUrl(n.sender_pic) 
          || Profiles.notfound;
      });
      response.forEach(n => {
        images[n.receiver_id] = imageUrl(n.receiver_pic_thumb)
          || imageUrl(n.receiver_pic)
          || Profiles.notfound;
      });
      setProfileImages(images);

    } catch (err) {
      console.error('[DASHBOARD] fetchAllNotifications error:', err);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ empty deps

  // ── On mount — fetch everything ONCE ─────────────────────────────────────
  // ✅ hasFetched ref prevents StrictMode double-invoke
  // ✅ empty deps array — runs once only
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const init = async () => {
      if (!userId) return;
      // Fetch user name + all data in parallel
      const [, , userRes] = await Promise.all([
        fetchAllNotifications(),
        fetchUnreadCounts(),
        fetchUserDetails(userId).catch(() => null)
      ]);
      if (userRes?.data?.ufname) setUserName(userRes.data.ufname);
    };

    init();
  }, []); // ✅ runs exactly once
  // ── Accept proposal ───────────────────────────────────────────────────────
  const handleAccept = async (proposalId) => {
    setActionLoading(proposalId);
    try {
      const res = await acceptProposal(proposalId, userId);
      if (res.data.status === 'Success') {
        setReceivedNotifs(prev =>
          prev.map(n => n.id === proposalId ? { ...n, status: 'accepted' } : n)
        );
        fetchUnreadCounts();
      } else {
        alert(res.data.result || 'Could not accept proposal.');
      }
    } catch (err) {
      console.error('[DASHBOARD] acceptProposal error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject proposal ───────────────────────────────────────────────────────
  const handleReject = async (proposalId) => {
    if (!window.confirm('Are you sure you want to reject this proposal?')) return;
    setActionLoading(proposalId);
    try {
      const res = await rejectProposal(proposalId, userId);
      if (res.data.status === 'Success') {
        setReceivedNotifs(prev =>
          prev.map(n => n.id === proposalId ? { ...n, status: 'rejected' } : n)
        );
        fetchUnreadCounts();
      } else {
        alert(res.data.result || 'Could not reject proposal.');
      }
    } catch (err) {
      console.error('[DASHBOARD] rejectProposal error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    try {
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return isNaN(age) ? 'N/A' : `${age} Yrs`;
    } catch { return 'N/A'; }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return ''; }
  };

  const statusBadge = (status) => {
    const map = {
      pending: { bg: '#fff8e1', color: '#f57f17', border: '#FFC107', label: '⏳ Pending' },
      accepted: { bg: '#e6f9ee', color: '#2e7d32', border: '#4CAF50', label: '✅ Accepted' },
      rejected: { bg: '#fdecea', color: '#c62828', border: '#f44336', label: '✗ Rejected' }
    };
    const s = map[status] || map.pending;
    return (
      <span style={{
        background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
        padding: '3px 10px', borderRadius: '12px',
        fontSize: '11px', fontWeight: 'bold'
      }}>
        {s.label}
      </span>
    );
  };

  // ── Tab button style ──────────────────────────────────────────────────────
  const tabBtnStyle = (tab) => ({
    padding: '8px 20px',
    borderRadius: '20px',
    border: activeTab === tab ? 'none' : '1px solid #dee2e6',
    background: activeTab === tab
      ? (tab === 'received' ? '#a84040' : '#a84040')
      : '#fff',
    color: activeTab === tab ? '#fff' : '#666',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
    marginRight: '10px'
  });

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <>
      {/* Heading */}
      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          {/* <h3>Dashboard MAT-{loginuser}  </h3> */}
          {/* <h3> Welcome, {userName || 'User'}'s Dashboard</h3> */}
          <h3>Welcome back, {userName || 'User'}! 💕</h3>
        </div>
      </div>

      <div className="inner-content">
        <div className="container">
          <div className="profile-Wrap">
            <div className="row">
              <Sidebar />

              <div className="col-lg-8 col-md-8">
                <div className="translateY-60">

                  {/* ── Stats Badges ─────────────────────────────────────── */}
                  <div className="userstats" >
                    <ul className="row" >

                      {/* Notifications stat */}
                      <li className="col-md-4">
                        <div className="statint" style={{background:"#555555"}}>
                          <div className="sticon" style={{ position: 'relative' }}>
                            <img src={Profiles.openjobs} alt="" />
                            {/* Unread badge dot */}
                            {unreadNotifications > 0 && (
                              <span style={{
                                position: 'absolute', top: '-4px', right: '-4px',
                                background: 'rgb(255 124 206)', color: '#fff',
                                borderRadius: '50%', fontSize: '9px',
                                width: '16px', height: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold'
                              }}>
                                {unreadNotifications > 99 ? '99+' : unreadNotifications}
                              </span>
                            )}
                          </div>
                          {/* Total count */}
                          <div className="count">{totalNotifications}</div>
                          <div className="stname">
                            Notifications
                            {/* Unread label below */}
                            {unreadNotifications > 0 && (
                              <span style={{
                                display: 'block', fontSize: '11px',
                                color: 'rgb(255 124 206)', fontWeight: 'bold', marginTop: '2px'
                              }}>
                                {unreadNotifications} new proposals
                              </span>
                            )}
                          </div>
                        </div>
                      </li>

                      {/* Messages stat */}
                      <li className="col-md-4">
                        <div className="statint" style={{background:"#555555"}}>
                          <div className="sticon" style={{ position: 'relative' }}>
                            <img src={Profiles.mail} alt="" />
                            {/* Unread badge dot */}
                            {unreadMessages > 0 && (
                              <span style={{
                                position: 'absolute', top: '-4px', right: '-4px',
                                background: 'rgb(255 124 206)', color: '#fff',
                                borderRadius: '50%', fontSize: '9px',
                                width: '16px', height: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold'
                              }}>
                                {unreadMessages > 99 ? '99+' : unreadMessages}
                              </span>
                            )}
                          </div>
                          {/* Total conversations count */}
                          <div className="count">{totalMessages}</div>
                          <div className="stname">
                            Messages
                            {/* Unread label below */}
                            {unreadMessages > 0 && (
                              <span style={{
                                display: 'block', fontSize: '11px',
                                color: 'rgb(255 124 206)', fontWeight: 'bold', marginTop: '2px'
                              }}>
                                {unreadMessages} unread messages
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                            {/* followers stat */}
                             
                                              <li className="col-md-4">
                                                 <div className="statint" style={{background:"#555555"}}>
                                                     <div className="sticon"><img src={Profiles.followers} alt="" /></div>
                                                     <div className="count">0</div>
                                                     <div className="stname">Followers</div>
                                                 </div>
                                             </li> 

                    </ul>
                  </div>

                  {/* ── Package Info ─────────────────────────────────────── */}
                  <div className="packageinfo">
                    <div className="titlepkg">Your Current Package</div>
                    <div className="packdetail">
                      <ul className="row">
                        <li className="col-md-6">
                          <div className="pkgbox">
                            <h3>Current Package</h3>
                            <h6 style={{ fontWeight: 'bold', color: '#F59E0B' }}>Gold Package</h6>
                            <p style={{ fontWeight: 'bold', color: '#a84040' }}>🎁 Free – Limited Launch Offer</p>
                          </div>
                        </li>
                        <li className="col-md-6">
                          <div className="pkgbox">
                            <h3 style={{ fontWeight: 'bold', color: 'black' }}>Available Credits</h3>
                            <h6 style={{ fontWeight: 'bold', color: '#a84040' }}>Unlimited</h6>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* ── Proposal Tables with Tab Switching ───────────────── */}
                  <div className="add-listing-box opening-day mrg-bot-25 padd-bot-30 padd-top-25">

                    {/* Tab Header */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      flexWrap: 'wrap', gap: '8px'
                    }}>
                      {/* Tab Buttons */}
                      <div>
                        {/* Proposals Received button */}
                        <button
                          style={tabBtnStyle('received')}
                          onClick={() => setActiveTab('received')}
                        >
                          <i className="far fa-bell" style={{ marginRight: '6px' }}></i>
                          Proposals Received
                          {receivedNotifs.length > 0 && (
                            <span style={{
                              background: activeTab === 'received' ? 'rgba(255,255,255,0.3)' : '#a84040',
                              color: '#fff',
                              borderRadius: '10px', padding: '1px 7px',
                              fontSize: '11px', marginLeft: '6px'
                            }}>
                              {receivedNotifs.length}
                            </span>
                          )}
                        </button>

                        {/* My Sent Proposals button */}
                        <button
                          style={tabBtnStyle('sent')}
                          onClick={() => setActiveTab('sent')}
                        >
                          <i className="far fa-paper-plane" style={{ marginRight: '6px' }}></i>
                          My Sent Proposals
                          {responseNotifs.length > 0 && (
                            <span style={{
                              background: activeTab === 'sent' ? 'rgba(255,255,255,0.3)' : '#a84040',
                              color: '#fff',
                              borderRadius: '10px', padding: '1px 7px',
                              fontSize: '11px', marginLeft: '6px'
                            }}>
                              {responseNotifs.length}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Refresh button */}
                      <button
                        onClick={() => { fetchAllNotifications(); fetchUnreadCounts(); }}
                        style={{
                          background: 'none', border: '1px solid #dee2e6',
                          color: '#666', borderRadius: '6px',
                          padding: '6px 14px', cursor: 'pointer', fontSize: '12px'
                        }}
                      >
                        <i className="fas fa-sync-alt" style={{ marginRight: '4px' }}></i>
                        Refresh
                      </button>
                    </div>

                    {/* ── TAB 1: Proposals Received ─────────────────────── */}
                    {activeTab === 'received' && (
                      // <div className="table-responsive reqpro">
                      <div
                        className="table-responsive reqpro"
                        style={{
                          maxHeight: '400px',       // shows ~6 rows, scrolls after that
                          overflowY: 'auto',
                          overflowX: 'auto'
                        }}
                      >
                        {loading ? (
                          <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                            Loading proposals...
                          </div>
                        ) : receivedNotifs.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                            <i className="far fa-bell" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}></i>
                            No proposals received yet.
                          </div>
                        ) : (
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Image</th>
                                <th>MAT ID</th>
                                <th>Name</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {receivedNotifs.map(n => (
                                <tr key={n.id}>
                                  {/* Image */}
                                  <td>
                                    <Link to={`/profiledetails/${n.sender_id}`}>
                                      <img
                                        src={profileImages[n.sender_id] || Profiles.notfound}
                                        alt={n.ufname}
                                        onError={e => { e.target.src = Profiles.notfound; }}
                                        style={{
                                          width: '45px', height: '45px',
                                          objectFit: 'cover', objectPosition: 'top',
                                          borderRadius: '50%', border: '2px solid #a84040'
                                        }}
                                      />
                                    </Link>
                                  </td>
                                  {/* MAT ID */}
                                  <td>
                                    <span style={{ fontSize: '12px', color: '#a84040', fontWeight: 'bold' }}>
                                      MAT{n.sender_id}
                                    </span>
                                  </td>
                                  {/* Name */}
                                  <td>
                                    <Link
                                      to={`/profiledetails/${n.sender_id}`}
                                      style={{ color: '#a84040', fontWeight: 'bold', textDecoration: 'none' }}
                                    >
                                      {`${n.ufname || ''} ${n.ulname || ''}`.trim() || 'Unknown'}
                                    </Link>
                                  </td>
                                  {/* Date */}
                                  <td style={{ fontSize: '12px', color: '#666' }}>
                                    {formatDate(n.created_at)}
                                  </td>
                                  {/* Status */}
                                  <td>{statusBadge(n.status)}</td>
                                  {/* Action */}
                                  <td>
                                    {n.status === 'pending' ? (
                                      <>
                                        <button
                                          onClick={() => handleAccept(n.id)}
                                          disabled={actionLoading === n.id}
                                          className="btn"
                                          style={{
                                            marginRight: '6px', fontSize: '12px',
                                            padding: '4px 10px',
                                            opacity: actionLoading === n.id ? 0.6 : 1
                                          }}
                                        >
                                          {actionLoading === n.id ? '⏳' : '✓ Accept'}
                                        </button>
                                        <button
                                          onClick={() => handleReject(n.id)}
                                          disabled={actionLoading === n.id}
                                          className="btn delete"
                                          title="Reject"
                                          style={{
                                            fontSize: '12px', padding: '4px 10px',
                                            opacity: actionLoading === n.id ? 0.6 : 1
                                          }}
                                        >
                                          <i className="fas fa-times"></i> Reject
                                        </button>
                                      </>
                                    ) : (
                                      <Link
                                        to={`/profiledetails/${n.sender_id}`}
                                        style={{ fontSize: '12px', color: '#a84040' }}
                                      >
                                        View Profile
                                      </Link>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    {/* ── TAB 2: My Sent Proposals Responses ───────────── */}
                    {activeTab === 'sent' && (
                      <div className="table-responsive reqpro"  style={{
                      maxHeight: '400px',       // shows ~6 rows, scrolls after that
                      overflowY: 'auto',
                      overflowX: 'auto'
                    }}>
                        {loading ? (
                          <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                            Loading...
                          </div>
                        ) : responseNotifs.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                            <i className="far fa-paper-plane" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}></i>
                            No responses to your sent proposals yet.
                          </div>
                        ) : (
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Image</th>
                                <th>MAT ID</th>
                                <th>Name</th>
                                <th>Age</th>
                                <th>Date</th>
                                <th>Response</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {responseNotifs.map(n => (
                                <tr key={n.id}>
                                  {/* Image */}
                                  <td>
                                    <Link to={`/profiledetails/${n.receiver_id}`}>
                                      <img
                                        src={profileImages[n.receiver_id] || Profiles.notfound}
                                        alt={n.ufname}
                                        onError={e => { e.target.src = Profiles.notfound; }}
                                        style={{
                                          width: '45px', height: '45px',
                                          objectFit: 'cover', objectPosition: 'top',
                                          borderRadius: '50%', border: '2px solid #a84040'
                                        }}
                                      />
                                    </Link>
                                  </td>
                                  {/* MAT ID */}
                                  <td>
                                    <span style={{ fontSize: '12px', color: '#a84040', fontWeight: 'bold' }}>
                                      MAT{n.receiver_id}
                                    </span>
                                  </td>
                                  {/* Name */}
                                  <td>
                                    <Link
                                      to={`/profiledetails/${n.receiver_id}`}
                                      style={{ color: '#a84040', fontWeight: 'bold', textDecoration: 'none' }}
                                    >
                                      {`${n.ufname || ''} ${n.ulname || ''}`.trim() || 'Unknown'}
                                    </Link>
                                  </td>
                                  {/* Age */}
                                  <td>{calculateAge(n.udob)}</td>
                                  {/* Date */}
                                  <td style={{ fontSize: '12px', color: '#666' }}>
                                    {formatDate(n.created_at)}
                                  </td>
                                  {/* Response */}
                                  <td>
                                    {n.response_status === 'accepted' ? (
                                      <span style={{
                                        background: '#e6f9ee', color: '#2e7d32',
                                        border: '1px solid #4CAF50',
                                        padding: '3px 10px', borderRadius: '12px',
                                        fontSize: '11px', fontWeight: 'bold'
                                      }}>🎉 Accepted</span>
                                    ) : n.response_status === 'rejected' ? (
                                      <span style={{
                                        background: '#fdecea', color: '#c62828',
                                        border: '1px solid #f44336',
                                        padding: '3px 10px', borderRadius: '12px',
                                        fontSize: '11px', fontWeight: 'bold'
                                      }}>✗ Rejected</span>
                                    ) : (
                                      <span style={{
                                        background: '#fff8e1', color: '#f57f17',
                                        border: '1px solid #FFC107',
                                        padding: '3px 10px', borderRadius: '12px',
                                        fontSize: '11px', fontWeight: 'bold'
                                      }}>⏳ Awaiting</span>
                                    )}
                                  </td>
                                  {/* Action */}
                                  <td>
                                    <Link
                                      to={`/profiledetails/${n.receiver_id}`}
                                      style={{ fontSize: '12px', color: '#a84040' }}
                                    >
                                      View Profile
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                  </div>
                  {/* end proposal tables */}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;