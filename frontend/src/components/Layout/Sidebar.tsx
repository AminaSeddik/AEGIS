import React from 'react';

export type ViewId =
  | 'overview' | 'alerts' | 'topology' | 'devices'
  | 'detection' | 'response' | 'crypto' | 'reports' | 'about';

interface NavItem {
  id: ViewId;
  num: string;
  label: string;
  color: string; // CSS var name, e.g. var(--cyan)
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',  num: '00', label: 'Overview',         color: 'var(--cyan)',
    icon: (<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>) },
  { id: 'alerts',    num: '01', label: 'Alerts',           color: 'var(--red)',
    icon: (<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>) },
  { id: 'topology',  num: '02', label: 'Network Map',      color: 'var(--mint)',
    icon: (<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="12" cy="12" r="2"/><path d="M12 7v3M10.5 13.5 7 17.5M13.5 13.5 17 17.5"/></svg>) },
  { id: 'devices',   num: '03', label: 'Devices',          color: 'var(--blue)',
    icon: (<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>) },
  { id: 'detection', num: '04', label: 'Detection Engine', color: 'var(--violet)',
    icon: (<svg viewBox="0 0 24 24"><path d="M12 2a4 4 0 0 0-4 4 4 4 0 0 0-4 4 4 4 0 0 0 1 2.6A4 4 0 0 0 8 19a3 3 0 0 0 4 1 3 3 0 0 0 4-1 4 4 0 0 0 3-6.4A4 4 0 0 0 20 10a4 4 0 0 0-4-4 4 4 0 0 0-4-4z"/><path d="M9 12h.01M15 12h.01"/></svg>) },
  { id: 'response',  num: '05', label: 'Response',         color: 'var(--orange)',
    icon: (<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>) },
  { id: 'crypto',    num: '06', label: 'Crypto Health',    color: 'var(--amber)',
    icon: (<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/><circle cx="12" cy="16" r="1.5"/></svg>) },
  { id: 'reports',   num: '07', label: 'Reports',          color: 'var(--cyan)',
    icon: (<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/></svg>) },
  { id: 'about',     num: '08', label: 'System',           color: 'var(--mint)',
    icon: (<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>) },
];

interface Props {
  activeView: ViewId;
  onSelect: (v: ViewId) => void;
  theme: 'dark' | 'light';
  onThemeChange: (t: 'dark' | 'light') => void;
}

const Sidebar: React.FC<Props> = ({ activeView, onSelect, theme, onThemeChange }) => {
  return (
    <aside className="aegis-sidebar">
      <div className="sidebar-ghost">AEGIS · GUARDIAN · 2026 · AEGIS · GUARDIAN</div>

      <div className="sb-head">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#06b6d4"/>
                  <stop offset="100%" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
              <path d="M21 3 L36 9 L36 22 C36 30 30 37 21 39 C12 37 6 30 6 22 L6 9 Z"
                    fill="url(#shieldGrad)" fillOpacity="0.15"
                    stroke="url(#shieldGrad)" strokeWidth="1.5"/>
              <path d="M21 12 L21 28 M14 20 L28 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--cyan)' }}/>
              <circle cx="21" cy="20" r="3.5" stroke="currentColor" strokeWidth="1.2" fill="none" style={{ color: 'var(--cyan)' }}/>
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-name">AEGIS<em>·</em></div>
            <div className="brand-sub">Command Center · v1.0</div>
          </div>
        </div>
      </div>

      <nav className="sb-nav">
        <div className="sb-nav-label">Operations</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item${activeView === item.id ? ' active' : ''}`}
            onClick={() => onSelect(item.id)}
            style={{ ['--item-color' as any]: item.color }}
          >
            <span className="nav-num">{item.num}</span>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            <span className="nav-dot"></span>
          </button>
        ))}
      </nav>

      <div className="sb-foot">
        <div className="theme-toggle">
          <button
            className={theme === 'dark' ? 'active' : ''}
            onClick={() => onThemeChange('dark')}
          >
            <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <span>Dark</span>
          </button>
          <button
            className={theme === 'light' ? 'active' : ''}
            onClick={() => onThemeChange('light')}
          >
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            <span>Light</span>
          </button>
        </div>
        <div className="sb-status">System Online · All Services Up</div>
        <div className="sb-meta">
          Nile University · ITCS<br/>
          Graduation Project · 2026<br/>
          Dr. Noha &middot; Dr. El-Helw
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
