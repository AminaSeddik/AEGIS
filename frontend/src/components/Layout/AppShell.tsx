import React, { useEffect, useState } from 'react';
import Sidebar, { ViewId } from './Sidebar';
import TopBar from './TopBar';
import '../../styles/tokens.css';
import '../../styles/shell.css';

type Theme = 'dark' | 'light';

interface Props {
  activeView: ViewId;
  onSelect: (v: ViewId) => void;
  children: React.ReactNode;
}

const THEME_KEY = 'aegis-theme';

const AppShell: React.FC<Props> = ({ activeView, onSelect, children }) => {
  // Persisted theme
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Sync data-theme attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  // Health probes - drives the API/WS indicators in the top bar
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    let alive = true;
    const probe = async () => {
      try {
        const r = await fetch('http://localhost:8002/api/crypto/health', {
          signal: AbortSignal.timeout(2500),
        } as any);
        if (alive) setApiStatus(r.ok ? 'online' : 'offline');
      } catch {
        if (alive) setApiStatus('offline');
      }
    };
    probe();
    const id = setInterval(probe, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let alive = true;
    let retry: ReturnType<typeof setTimeout> | null = null;
    const connect = () => {
      try {
        ws = new WebSocket('ws://localhost:8002/ws');
        ws.onopen  = () => alive && setWsStatus('connected');
        ws.onclose = () => {
          if (!alive) return;
          setWsStatus('disconnected');
          retry = setTimeout(connect, 3000);
        };
        ws.onerror = () => { try { ws?.close(); } catch {} };
      } catch {
        retry = setTimeout(connect, 3000);
      }
    };
    connect();
    return () => {
      alive = false;
      if (retry) clearTimeout(retry);
      try { ws?.close(); } catch {}
    };
  }, []);

  return (
    <div className="aegis-app">
      <Sidebar
        activeView={activeView}
        onSelect={onSelect}
        theme={theme}
        onThemeChange={setTheme}
      />
      <main className="aegis-main">
        <TopBar
          activeView={activeView}
          apiStatus={apiStatus}
          wsStatus={wsStatus}
        />
        <div className="view-stage">
          <div className={`view-host view-${activeView}`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppShell;
