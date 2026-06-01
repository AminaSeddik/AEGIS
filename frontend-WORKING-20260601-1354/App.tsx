import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';
import Dashboard from './components/Dashboard/Dashboard';
import ThreatDetection from './components/ThreatDetection/ThreatDetection';
import DeviceManagement from './components/DeviceManagement/DeviceManagement';
import Analytics from './components/Analytics/Analytics';
import NetworkTopology from './components/NetworkTopology/NetworkTopology';
import HospitalMap from './components/HospitalMap/HospitalMap';
import Reports from './components/Reports/Reports';
import CryptoMonitor from './components/CryptoMonitor/CryptoMonitor';
import AIMonitor from './components/AIMonitor/AIMonitor';
import Settings from './components/Settings/Settings';
import AppShell from './components/Layout/AppShell';
import type { ViewId } from './components/Layout/Sidebar';

interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
  memory_used_gb: number;
  network_speed_mbps: number;
}

interface Notification {
  id: number;
  type: 'threat' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const ATTACK_MESSAGES: Record<string, { title: string; message: string }> = {
  'DDoS': { title: 'DDoS Attack Detected', message: 'High volume distributed traffic detected' },
  'DoS': { title: 'DoS Attack Detected', message: 'Denial of service attempt detected' },
  'ICMP_Flood': { title: 'ICMP Flood Attack', message: 'ICMP ping flood detected' },
  'ARP_Spoofing': { title: 'ARP Spoofing Detected', message: 'ARP cache poisoning attempt' },
  'MQTT_Attack': { title: 'MQTT Protocol Attack', message: 'Malicious MQTT activity detected' },
  'Ransomware': { title: 'Ransomware Detected', message: 'Encryption attempt blocked' },
  'Reconnaissance': { title: 'Reconnaissance Activity', message: 'Network scanning detected' },
  'Data_Exfiltration': { title: 'Data Exfiltration Alert', message: 'Unusual data transfer detected' },
};

const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpu_percent: 0,
    memory_percent: 0,
    memory_used_gb: 0,
    network_speed_mbps: 0
  });
  const [backendConnected, setBackendConnected] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, setTick] = useState(0);
  const notificationIdRef = useRef(0);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isDark = theme === 'dark';

  const addThreatNotification = useCallback((threatType: string, deviceName?: string) => {
    if (threatType === 'Benign') return;
    const attackInfo = ATTACK_MESSAGES[threatType] || { title: `${threatType} Detected`, message: 'Suspicious activity detected' };
    const newNotification: Notification = {
      id: ++notificationIdRef.current,
      type: 'threat',
      title: attackInfo.title,
      message: deviceName ? `${attackInfo.message} from ${deviceName}` : attackInfo.message,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:8000/ws');
        ws.onopen = () => { console.log('App WebSocket connected'); };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'threat' && data.data?.threat_type) {
              addThreatNotification(data.data.threat_type, data.data.device_name);
            }
          } catch (e) { /* ignore */ }
        };
        ws.onclose = () => { setTimeout(connectWebSocket, 3000); };
        wsRef.current = ws;
      } catch (e) { setTimeout(connectWebSocket, 3000); }
    };
    connectWebSocket();
    return () => wsRef.current?.close();
  }, [addThreatNotification]);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/system-stats');
        if (response.ok) {
          const data = await response.json();
          setSystemStats({
            cpu_percent: data.cpu_percent || 0,
            memory_percent: data.memory_percent || 0,
            memory_used_gb: data.memory_used_gb || 0,
            network_speed_mbps: data.network_speed_mbps || 0
          });
          setBackendConnected(true);
        } else {
          setBackendConnected(false);
        }
      } catch (error) {
        setBackendConnected(false);
      }
    };
    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { id: 'topology', label: 'Network Topology', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id: 'hospital', label: 'Hospital Map', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { id: 'threats', label: 'Threat Detection', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
    { id: 'devices', label: 'Device Management', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg> },
    { id: 'analytics', label: 'Analytics', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { id: 'reports', label: 'Daily Reports', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 'crypto', label: 'Crypto Monitor', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
    { id: 'ai-pipeline', label: 'AI + Crypto Pipeline', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { id: 'settings', label: 'Settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  const getStatColor = (value: number) => {
    if (value > 80) return isDark ? 'text-red-400' : 'text-red-600';
    if (value > 60) return isDark ? 'text-yellow-400' : 'text-yellow-600';
    return isDark ? 'text-emerald-400' : 'text-emerald-600';
  };

  const getStatDot = (value: number) => {
    if (value > 80) return 'bg-red-500';
    if (value > 60) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAsRead = (id: number) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllAsRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'threat': return <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>;
      case 'warning': return <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>;
      case 'success': return <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>;
      default: return <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>;
    }
  };

  // Map old tab IDs to new ViewIds (preserves existing setActiveTab calls)
  const TAB_TO_VIEW: Record<string, ViewId> = {
    dashboard: 'overview',
    threats: 'alerts',
    topology: 'topology',
    devices: 'devices',
    hospital: 'devices',
    analytics: 'detection',
    'ai-pipeline': 'detection',
    crypto: 'crypto',
    reports: 'reports',
    settings: 'about',
  };
  const VIEW_TO_TAB: Record<ViewId, string> = {
    overview: 'dashboard',
    alerts: 'threats',
    topology: 'topology',
    devices: 'devices',
    detection: 'ai-pipeline',
    response: 'crypto',  // placeholder until response view exists
    crypto: 'crypto',
    reports: 'reports',
    about: 'settings',
  };
  const currentView: ViewId = TAB_TO_VIEW[activeTab] || 'overview';

  return (
    <AppShell
      activeView={currentView}
      onSelect={(v) => setActiveTab(VIEW_TO_TAB[v])}
    >
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'topology' && <NetworkTopology />}
          {activeTab === 'hospital' && <HospitalMap />}
          {activeTab === 'threats' && <ThreatDetection />}
          {activeTab === 'devices' && <DeviceManagement />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'crypto' && <CryptoMonitor />}
          {activeTab === 'ai-pipeline' && <AIMonitor />}
          {activeTab === 'settings' && <Settings />}
    </AppShell>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
