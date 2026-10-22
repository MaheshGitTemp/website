// src/components/templates/BottomNav.js
// ─────────────────────────────────────────────────────────────────────────────
// MOBILE-ONLY fixed bottom navigation bar (PhonePe-style).
// 5 items: Home, Matches, Search (advanced search), Chat, Dashboard.
// - Renders only on mobile widths (< 768px).
// - Hidden on the admin area (/adminhub/*), which has its own shell.
// - Highlights the active route in the brand color.
// Mounted once in App.js inside <Router> so it appears on every page.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const BRAND = '#a84040';

const NAV_ITEMS = [
  { to: '/',              label: 'Home',      icon: 'fas fa-home' },
  { to: '/profiles',      label: 'Matches',   icon: 'fas fa-heart' },
  { to: '/advancesearch', label: 'Search',    icon: 'fas fa-search' },
  { to: '/messages',      label: 'Chat',      icon: 'far fa-comment-dots' },
  { to: '/dashboard',     label: 'Dashboard', icon: 'fas fa-th-large' },
];

const BottomNav = () => {
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Desktop: no bottom nav. Admin area: no bottom nav (own layout).
  if (!isMobile) return null;
  if (location.pathname.startsWith('/adminhub')) return null;
  if (location.pathname === '/impersonate') return null;

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      {/* Spacer so page content/footer isn't hidden behind the fixed bar */}
      <div style={{ height: '64px' }} aria-hidden="true" />

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '62px',
          background: '#fff',
          borderTop: '1px solid #eee',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
          display: 'flex',
          zIndex: 1200,
          paddingBottom: 'env(safe-area-inset-bottom)', // iOS home-indicator gap
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => {
                // Always scroll to the top so the user lands on the start of the
                // page — works whether navigating to a new route or re-tapping
                // the current one (where the route doesn't change). A short
                // timeout lets the destination render before scrolling.
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
              }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                textDecoration: 'none',
                color: active ? BRAND : '#777',
                fontSize: '11px',
                fontWeight: active ? 700 : 500,
                transition: 'color 0.15s',
              }}
            >
              <i className={item.icon} style={{ fontSize: '18px' }}></i>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default BottomNav;
