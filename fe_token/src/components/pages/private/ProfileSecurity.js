 
import React, { useEffect, useState } from 'react'
import Profiles from '../../templates/ImagesLoader'
import Sidebar from './templates/Sidebar'
import { getPrivacySettings, updatePrivacySettings } from '../../../services/userService';
import { useToast } from '../../../components/hooks/ToastContext';
const ProfileSecurity = () => {
const { showToast } = useToast();
  // ── State ──────────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState({
    hide_email:   false,
    hide_phone:   false,
    hide_gallery: false,
    hide_picture: false
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [message,  setMessage]  = useState({ text: '', type: '' }); // type: 'success'|'error'

  // ── Load settings on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getPrivacySettings();
        if (res.data.status === 'Success') {
          setSettings(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load privacy settings:', err);
        setMessage({ text: 'Failed to load settings. Please refresh.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // ── Auto-clear message after 3s ───────────────────────────────────────────
  useEffect(() => {
    if (!message.text) return;
    const t = setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    return () => clearTimeout(t);
  }, [message]);

  // ── Handle checkbox change ─────────────────────────────────────────────────
  const handleChange = (field) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // ── Handle form submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updatePrivacySettings(
        settings.hide_email,
        settings.hide_phone,
        settings.hide_gallery,
        settings.hide_picture
      );
      if (res.data.status === 'Success') {
        // ✅ Success
showToast({
  title:       'Settings Saved',
  description: 'Your privacy settings have been updated successfully.',
  type:        'success'
});
        setSettings(res.data.data); // sync with server response
        setMessage({ text: 'Privacy settings updated successfully.', type: 'success' });
      } else {
        // ❌ Failure
showToast({
  title:       'Save Failed',
  description: 'Could not update privacy settings. Please try again.',
  type:        'error'
});
        setMessage({ text: res.data.result || 'Update failed. Please try again.', type: 'error' });
      }
    } catch (err) {
      console.error('updatePrivacySettings error:', err);
      setMessage({ text: 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* <!--Inner Heading Start--> */}
      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>Profile Security</h3>
        </div>
      </div>
      {/* <!--Inner Heading End--> */}

      {/* <!--Inner Content Start--> */}
      <div className="inner-content">
        <div className="container">
          <div className="profile-Wrap">
            <div className="row">

              <Sidebar />

              <div className="col-lg-8 col-md-8">
                <div className="translateY-60">

                  {/* ── Profile Security Form ────────────────────────────── */}
                  <div className="add-listing-box opening-day mrg-bot-25 padd-bot-30 padd-top-25">
                    <div className="listing-box-header">
                      <i className="fas fa-lock"></i>
                      <h3>Set Profile Security</h3>
                      <p>Mark Checkboxes to hide your personal info</p>
                    </div>

                    {/* ── Status Message ───────────────────────────────────── */}
                    {message.text && (
                      <div
                        className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                        style={{ margin: '0 10px 16px 10px', fontSize: '14px' }}
                      >
                        <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}
                           style={{ marginRight: '6px' }}></i>
                        {message.text}
                      </div>
                    )}

                    {/* ── Loading State ────────────────────────────────────── */}
                    {loading ? (
                      <div style={{ padding: '20px 10px', color: '#888', fontSize: '14px' }}>
                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                        Loading settings...
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit}>
                        <div className="mrg-r-10 mrg-l-10">

                          {/* Hide Email */}
                          <div className="input-group checkbox">
                            <input
                              type="checkbox"
                              name="hide_email"
                              id="hdemail"
                              checked={settings.hide_email}
                              onChange={() => handleChange('hide_email')}
                            />
                            <label htmlFor="hdemail"></label>
                            Hide Email to Users
                          </div>

                          {/* Hide Phone */}
                          <div className="input-group checkbox">
                            <input
                              type="checkbox"
                              name="hide_phone"
                              id="hdphone"
                              checked={settings.hide_phone}
                              onChange={() => handleChange('hide_phone')}
                            />
                            <label htmlFor="hdphone"></label>
                            Hide Phone to Users
                          </div>

                          {/* Hide Gallery */}
                          <div className="input-group checkbox">
                            <input
                              type="checkbox"
                              name="hide_gallery"
                              id="hdgallery"
                              checked={settings.hide_gallery}
                              onChange={() => handleChange('hide_gallery')}
                            />
                            <label htmlFor="hdgallery"></label>
                            Hide photo Gallery
                          </div>

                          {/* Hide Profile Picture */}
                          <div className="input-group checkbox">
                            <input
                              type="checkbox"
                              name="hide_picture"
                              id="hdpic"
                              checked={settings.hide_picture}
                              onChange={() => handleChange('hide_picture')}
                            />
                            <label htmlFor="hdpic"></label>
                            Hide Profile picture
                          </div>

                        </div>

                        <div className="mt-5">
                          <button
                            className="btn theme-btn"
                            type="submit"
                            title="Update Profile"
                            disabled={saving}
                          >
                            {saving
                              ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>Saving...</>
                              : 'Update Security'
                            }
                          </button>
                        </div>
                      </form>
                    )}

                  </div>
                  {/* ── End Profile Security Form ─────────────────────────── */}

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      {/* <!--Inner Content End--> */}
    </>
  );
};

export default ProfileSecurity;