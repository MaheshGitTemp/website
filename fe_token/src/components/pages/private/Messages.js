 


import React, { useEffect, useState, useRef, useCallback } from 'react';
import Profiles from '../../templates/ImagesLoader';
import Sidebar from './templates/Sidebar';
import '../../../assets/css/message.css';
import { useNavigate } from 'react-router-dom';
import { imageUrl } from '../../../utils/imageUrl';
import { 
  fetchInbox as fetchInboxService, 
  fetchMessages as fetchMessagesService, 
  sendMessage as sendMessageService, 
  deleteMessage as deleteMessageService 
} from '../../../services/messageService';


const Messages = () => {
  
const userId = Number(localStorage.getItem('userId'));
  // ─── State ───────────────────────────────────────────────────────────────
  const [inbox,           setInbox]           = useState([]);
  const [inboxLoading,    setInboxLoading]    = useState(true);
  const [searchText,      setSearchText]      = useState('');
  const [activeConv,      setActiveConv]      = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage,      setNewMessage]      = useState('');
  const [sending,         setSending]         = useState(false);

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const inputRef             = useRef(null);
  const pollingRef           = useRef(null);
  const activeConvRef        = useRef(null);
  const messagesContainerRef = useRef(null);

  const navigate = useNavigate();

  const viewUserProfile = () => {
    if (activeConv?.other_user_id) {
      navigate(`/profiledetails/${activeConv.other_user_id}`);
    }
  };

  // Keep activeConvRef in sync
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // ─── Scroll chat to bottom ────────────────────────────────────────────────
  const scrollChatToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, []);

  // ─── Check if near bottom ─────────────────────────────────────────────────
  const isChatNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 120;
  }, []);

  // ─── Fetch Inbox ──────────────────────────────────────────────────────────
  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetchInboxService(userId);
      if (res.data.status === 'Success') setInbox(res.data.data || []);
    } catch (err) { console.error('[CHAT] fetchInbox:', err); }
    finally { setInboxLoading(false); }
  }, [userId]);

  useEffect(() => { fetchInbox(); }, [fetchInbox]);

  // ─── Fetch Messages ───────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (otherUserId, isInitial = false) => {
    if (!otherUserId) return;
    if (isInitial) { setMessagesLoading(true); setMessages([]); }
    try {
      const res = await fetchMessagesService(userId, otherUserId, 1, 100);
      if (res.data.status === 'Success') {
        const newMsgs = res.data.data || [];
        if (isInitial) {
          setMessages(newMsgs);
          setTimeout(() => scrollChatToBottom(), 80);
          fetchInbox();
        } else {
          setMessages(prev => {
            if (prev.length !== newMsgs.length) {
              if (isChatNearBottom()) setTimeout(() => scrollChatToBottom(), 80);
              fetchInbox();
              return newMsgs;
            }
            return prev;
          });
        }
      }
    } catch (err) { console.error('[CHAT] fetchMessages:', err); }
    finally { if (isInitial) setMessagesLoading(false); }
  }, [userId, fetchInbox, scrollChatToBottom, isChatNearBottom]);

  // ─── Open Conversation ────────────────────────────────────────────────────
  const openConversation = (conv) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setActiveConv(conv);
    fetchMessages(conv.other_user_id, true);
    pollingRef.current = setInterval(() => {
      const current = activeConvRef.current;
      if (current?.other_user_id) fetchMessages(current.other_user_id, false);
    }, 5000);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // Stop polling on unmount
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // ─── Pause polling when tab hidden ───────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (pollingRef.current) clearInterval(pollingRef.current);
      } else {
        const conv = activeConvRef.current;
        if (conv?.other_user_id) {
          pollingRef.current = setInterval(() => {
            fetchMessages(activeConvRef.current?.other_user_id, false);
          }, 5000);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchMessages]);

  // ─── Send Message ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv || sending) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    const tempMsg = {
      id: `temp-${Date.now()}`, sender_id: userId,
      receiver_id: activeConv.other_user_id, message: text,
      message_type: 'text', is_read: false,
      created_at: new Date().toISOString(), _temp: true
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => scrollChatToBottom(), 30);
    try {
      const res = await sendMessageService(userId, activeConv.other_user_id, text, 'text');
      if (res.data.status === 'Success') {
        setMessages(prev => prev.map(m => m._temp ? { ...res.data.data } : m));
        fetchInbox();
      }
    } catch (err) {
      console.error('[CHAT] sendMessage:', err);
      setMessages(prev => prev.filter(m => !m._temp));
      setNewMessage(text);
    } finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ─── Delete Message ───────────────────────────────────────────────────────
  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      const res = await deleteMessageService(messageId, userId);
      if (res.data.status === 'Success') {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (err) { console.error('[CHAT] deleteMessage:', err); }
  };

  // ─── Formatters ───────────────────────────────────────────────────────────
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch { return ''; }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d         = new Date(dateStr);
      const today     = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === today.toDateString())     return 'Today';
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  const groupedMessages = () => {
    const groups = {};
    messages.forEach(m => {
      const date = formatDate(m.created_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
    });
    return groups;
  };

  const filteredInbox = inbox.filter(conv => {
    const name = `${conv.other_fname || ''} ${conv.other_lname || ''}`.toLowerCase();
    return name.includes(searchText.toLowerCase());
  });

  // ── Profile pic helper — uses thumb for small icons ───────────────────────
  // imagepath_thumb → tiny 150×150 → perfect for inbox list + chat bubbles
  // Falls back to imagepath if thumb not yet generated (old records)
  const getProfilePic = (conv) => {
    if (!conv?.other_profile_pic) return Profiles.notfound;
    return imageUrl(conv.other_profile_pic_thumb) 
        || imageUrl(conv.other_profile_pic) 
        || Profiles.notfound;
  };

  // ── Active chat header pic — medium is better for header ──────────────────
  const getHeaderPic = (conv) => {
    if (!conv?.other_profile_pic) return Profiles.notfound;
    return imageUrl(conv.other_profile_pic_medium)
        || imageUrl(conv.other_profile_pic)
        || Profiles.notfound;
  };

  // ── Chat bubble sender pic — thumb is enough for small avatar ─────────────
  const getBubblePic = (conv) => {
    if (!conv?.other_profile_pic) return Profiles.notfound;
    return imageUrl(conv.other_profile_pic_thumb)
        || imageUrl(conv.other_profile_pic)
        || Profiles.notfound;
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container"><h3>Messages & Chats</h3></div>
      </div>

      <div className="inner-content">
        <div className="container">
          <div className="profile-Wrap">
            <div className="row">
              <Sidebar />
              <div className="col-lg-8 col-md-8">
                <div id="frame">

                  {/* ── LEFT PANEL — Inbox list ─────────────────────────────── */}
                  <div id="sidepanel">
                    <div id="search">
                      <label htmlFor="search-input">
                        <i className="fa fa-search"></i>
                      </label>
                      <input
                        id="search-input" type="text"
                        placeholder="Search contacts..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                      />
                    </div>

                    <div id="contacts">
                      {inboxLoading && <div className="loading">Loading...</div>}
                      {!inboxLoading && filteredInbox.length === 0 && (
                        <div className="empty">
                          {searchText ? 'No contacts found.' : 'No conversations yet.'}
                        </div>
                      )}
                      <ul>
                        {filteredInbox.map(conv => {
                          const isActive     = activeConv?.conversation_id === conv.conversation_id;
                          const hasUnread    = Number(conv.unread_count) > 0;
                          const isLastFromMe = Number(conv.last_message_sender_id) === userId;

                          return (
                            <li
                              key={conv.conversation_id}
                              className={`contact ${isActive ? 'active' : ''}`}
                              onClick={() => openConversation(conv)}
                            >
                              <div className="wrap">
                                <span className={`contact-status ${conv.other_status || 'offline'}`}></span>
                                {/* ✅ Inbox list — thumb (150×150) — tiny icon */}
                                <img
                                  src={getProfilePic(conv)}
                                  alt={conv.other_fname}
                                  onError={e => { e.target.src = Profiles.notfound; }}
                                />
                                <div className="meta">
                                  <p className="name user-name">{conv.other_fname} {conv.other_lname}</p>
                                  <p className="preview">
                                    {isLastFromMe && <span>You: </span>}
                                    {conv.last_message_type === 'image' ? '📷 Photo' :
                                     conv.last_message_type === 'file'  ? '📎 File'  :
                                     conv.last_message || 'Start a conversation'}
                                  </p>
                                </div>
                                {hasUnread && (
                                  <span className="unread-count">
                                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                  {/* ── End Left Panel ── */}

                  {/* ── RIGHT PANEL — Active chat ───────────────────────────── */}
                  <div className="content">
                    {!activeConv ? (
                      <div className="chat-placeholder">
                        <i className="far fa-comment"></i>
                        <p>Select a conversation to start chatting</p>
                      </div>
                    ) : (
                      <>
                        {/* Chat Header */}
                        <div className="contact-profile">
                          {/* ✅ Header — medium (600×800) — larger display */}
                          <img
                            src={getHeaderPic(activeConv)}
                            alt={activeConv.other_fname}
                            onClick={viewUserProfile}
                            style={{ cursor: 'pointer' }}
                            onError={e => { e.target.src = Profiles.notfound; }}
                          />
                          <p
                            className="user-name"
                            onClick={viewUserProfile}
                            style={{ cursor: 'pointer', color: '#a84040' }}
                          >
                            {activeConv.other_fname} {activeConv.other_lname}
                          </p>
                          <div className="social-media">
                            <i className="fa fa-phone"></i>
                            <i className="fa fa-video-camera"></i>
                            <i className="fa fa-ellipsis-v"></i>
                          </div>
                        </div>

                        {/* Messages area */}
                        <div className="messages" ref={messagesContainerRef}>
                          <ul>
                            {messagesLoading && messages.length === 0 && (
                              <li style={{ textAlign: 'center', color: '#aaa', padding: '20px', listStyle: 'none' }}>
                                Loading messages...
                              </li>
                            )}
                            {!messagesLoading && messages.length === 0 && (
                              <li style={{ textAlign: 'center', color: '#aaa', padding: '20px', listStyle: 'none', fontSize: '13px' }}>
                                No messages yet. Say hello! 👋
                              </li>
                            )}

                            {Object.entries(groupedMessages()).map(([date, msgs]) => (
                              <React.Fragment key={date}>
                                {/* Date separator */}
                                <li style={{
                                  textAlign: 'center', color: '#aaa',
                                  fontSize: '11px', margin: '10px 0', listStyle: 'none'
                                }}>
                                  <span style={{ background: '#e0e0e0', padding: '3px 10px', borderRadius: '10px' }}>
                                    {date}
                                  </span>
                                </li>

                                {msgs.map(msg => {
                                  const isSent = Number(msg.sender_id) === userId;
                                  return (
                                    <li
                                      key={msg.id}
                                      className={isSent ? 'sent' : 'replies'}
                                      style={{ position: 'relative' }}
                                    >
                                      {/* ✅ Chat bubble avatar — thumb (150×150) — tiny */}
                                      <img
                                        src={isSent
                                          ? Profiles.authorimg
                                          : getBubblePic(activeConv)
                                        }
                                        alt=""
                                        onError={e => { e.target.src = Profiles.notfound; }}
                                      />
                                      <p>
                                        {msg.message_type === 'image' ? (
                                          <img
                                            src={imageUrl(msg.message)}
                                            alt="attachment"
                                            style={{ maxWidth: '200px', borderRadius: '8px', display: 'block' }}
                                          />
                                        ) : (
                                          <span>{msg.message}</span>
                                        )}
                                        <span style={{
                                          fontSize: '10px', opacity: 0.7, display: 'block',
                                          marginTop: '4px', textAlign: isSent ? 'right' : 'left'
                                        }}>
                                          {formatTime(msg.created_at)}
                                          {isSent && (
                                            <span style={{ marginLeft: '4px' }}>
                                              {msg.is_read ? '✓✓' : '✓'}
                                            </span>
                                          )}
                                        </span>
                                      </p>
                                      {isSent && !msg._temp && (
                                        <button
                                          onClick={() => handleDelete(msg.id)}
                                          className="delete-hover"
                                        >
                                          <i className="fas fa-times"></i>
                                        </button>
                                      )}
                                    </li>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </ul>
                        </div>

                        {/* Input */}
                        <div className="message-input">
                          <div className="wrap">
                            <input
                              ref={inputRef}
                              type="text"
                              placeholder="Write your message..."
                              value={newMessage}
                              onChange={e => setNewMessage(e.target.value)}
                              onKeyDown={handleKeyDown}
                              disabled={sending}
                            />
                            <i className="fa fa-paperclip attachment"></i>
                            <button
                              className="submit"
                              onClick={handleSend}
                              disabled={sending || !newMessage.trim()}
                            >
                              <i className="fa fa-paper-plane"></i>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {/* ── End Right Panel ── */}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Messages;
