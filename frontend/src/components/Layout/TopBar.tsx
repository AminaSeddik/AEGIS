import React, { useEffect, useState } from 'react';
import type { ViewId } from './Sidebar';

const VIEW_META: Record<ViewId, { num: string; label: string }> = {
  overview:  { num: '00.', label: 'Overview' },
  alerts:    { num: '01.', label: 'Alerts' },
  topology:  { num: '02.', label: 'Network Map' },
  devices:   { num: '03.', label: 'Devices' },
  detection: { num: '04.', label: 'Detection Engine' },
  response:  { num: '05.', label: 'Response' },
  crypto:    { num: '06.', label: 'Crypto Health' },
  reports:   { num: '07.', label: 'Reports' },
  about:     { num: '08.', label: 'System' },
};

interface Props {
  activeView: ViewId;
  apiStatus?: 'online' | 'offline' | 'checking';
  wsStatus?: 'connected' | 'disconnected';
  modelVersion?: string;
}

const TopBar: React.FC<Props> = ({
  activeView,
  apiStatus = 'checking',
  wsStatus = 'disconnected',
  modelVersion = 'v2.4',
}) => {
  const meta = VIEW_META[activeView];
  const [clock, setClock] = useState('--:--:--');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const apiColor = apiStatus === 'online' ? 'var(--mint)' : apiStatus === 'offline' ? 'var(--red)' : 'var(--amber)';
  const apiLabel = apiStatus === 'online' ? '200' : apiStatus === 'offline' ? 'OFF' : '...';
  const wsColor = wsStatus === 'connected' ? 'var(--mint)' : 'var(--red)';
  const wsLabel = wsStatus === 'connected' ? 'CON' : 'OFF';

  return (
    <header className="topbar">
      <div className="crumb">
        <span className="crumb-num">{meta.num}</span>
        <span className="crumb-name">{meta.label}</span>
      </div>

      <div className="topbar-search">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <span>Search devices, threats, classes…</span>
        <kbd>/</kbd>
      </div>

      <div className="topbar-meta">
        <span className="live-pulse">LIVE</span>
        <span className="mono">{clock}</span>
        <span className="sep"></span>
        <span>API <strong style={{ color: apiColor }}>{apiLabel}</strong></span>
        <span>WS <strong style={{ color: wsColor }}>{wsLabel}</strong></span>
        <span>MDL <strong>{modelVersion}</strong></span>
      </div>
    </header>
  );
};

export default TopBar;
