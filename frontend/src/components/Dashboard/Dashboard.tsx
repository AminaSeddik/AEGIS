import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../ThemeContext';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getDashboardStats, getActiveThreats, createWebSocket } from '../../services/api';
import StatusLED, { LEDStatus } from '../StatusLED/StatusLED';
import ViewShell from '../Layout/ViewShell';

interface Threat {
  id: number;
  timestamp: string;
  threat_type: string;
  severity: string;
  confidence: number;
  device_id: string;
  device_name: string;
  zone?: string;
  status: string;
  description: string;
}

interface DashboardStats {
  network_status: string;
  active_threats: number;
  online_devices: number;
  total_devices: number;
  threats_prevented: number;
  uptime: string;
}

interface TrafficPoint {
  time: string;
  packets: number;
  type: string;
}

const ALL_ATTACK_TYPES = [
  { key: 'DDoS', name: 'DDoS', color: '#ef4444' },
  { key: 'DoS', name: 'DoS', color: '#f97316' },
  { key: 'ICMP_Flood', name: 'ICMP Flood', color: '#06b6d4' },
  { key: 'ARP_Spoofing', name: 'ARP Spoofing', color: '#10b981' },
  { key: 'MQTT_Attack', name: 'MQTT Attack', color: '#ec4899' },
  { key: 'Ransomware', name: 'Ransomware', color: '#8b5cf6' },
  { key: 'Reconnaissance', name: 'Reconnaissance', color: '#6366f1' },
  { key: 'Data_Exfiltration', name: 'Data Exfiltration', color: '#f59e0b' },
  { key: 'Benign', name: 'Benign', color: '#22c55e' },
];

const ATTACK_COLOR_MAP: Record<string, string> = {};
ALL_ATTACK_TYPES.forEach(a => { ATTACK_COLOR_MAP[a.key] = a.color; });

const HOSPITAL_ZONES = [
  { key: 'ICU',        label: 'Intensive Care' },
  { key: 'ER',         label: 'Emergency Room' },
  { key: 'OR',         label: 'Operating Rooms' },
  { key: 'WARD',       label: 'General Ward' },
  { key: 'DATACENTER', label: 'Data Center' },
  { key: 'CORE',       label: 'Core Network' },
];

const sevClass = (s: string) =>
  s === 'critical' ? 'crit' : s === 'high' ? 'high' : s === 'medium' ? 'med' : 'info';

const actInfo = (st: string) =>
  st === 'active' ? { c: 'monitor', l: 'Triage' }
  : (st === 'blocked' || st === 'mitigated') ? { c: 'blocked', l: 'Blocked' }
  : { c: 'allowed', l: st || 'ok' };

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats>({
    network_status: 'secure',
    active_threats: 0,
    online_devices: 85,
    total_devices: 85,
    threats_prevented: 0,
    uptime: '99.97%',
  });
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  const [trafficData, setTrafficData] = useState<TrafficPoint[]>([]);
  const [attackCounts, setAttackCounts] = useState<Record<string, number>>({});
  const [attackHistory, setAttackHistory] = useState<Record<string, number[]>>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentAttack, setCurrentAttack] = useState<string>('None');

  const wsRef = useRef<any>(null);

  const fetchNetworkData = useCallback(async () => {
    try {
      const [trafficRes, attackRes] = await Promise.all([
        fetch('http://localhost:8000/api/network/traffic'),
        fetch('http://localhost:8000/api/network/attacks')
      ]);

      if (trafficRes.ok) {
        const data = await trafficRes.json();
        if (data.history && data.history.length > 0) {
          const transformed = data.history.slice(-30).map((point: any) => ({
            time: point.time.split(':').slice(1).join(':'),
            packets: Math.round(point.packets / 1000),
            type: point.type,
          }));
          setTrafficData(transformed);

          const newHistory: Record<string, number[]> = {};
          ALL_ATTACK_TYPES.forEach(a => { newHistory[a.key] = []; });

          data.history.slice(-15).forEach((point: any) => {
            ALL_ATTACK_TYPES.forEach(a => {
              if (point.type === a.key) {
                newHistory[a.key].push(Math.round(point.packets / 1000));
              } else {
                newHistory[a.key].push(0);
              }
            });
          });
          setAttackHistory(newHistory);

          const latest = data.history[data.history.length - 1];
          if (latest) {
            setCurrentAttack(latest.type);
            setLastUpdate(new Date());
          }
        }
      }

      if (attackRes.ok) {
        const data = await attackRes.json();
        if (data.counts) setAttackCounts(data.counts);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, threatsData] = await Promise.all([getDashboardStats(), getActiveThreats()]);
        if (statsData) setStats(statsData);
        if (Array.isArray(threatsData)) setThreats(threatsData);
        setLoading(false);
      } catch (error) { setLoading(false); }
    };
    fetchAll();
    fetchNetworkData();
  }, [fetchNetworkData]);

  useEffect(() => {
    const fastInterval = setInterval(() => {
      fetchNetworkData();
      getDashboardStats().then(s => s && setStats(s));
      getActiveThreats().then(t => Array.isArray(t) && setThreats(t));
    }, 500);
    return () => clearInterval(fastInterval);
  }, [fetchNetworkData]);

  useEffect(() => {
    const ws = createWebSocket((data) => {
      setWsConnected(true);
      if (data.type === 'threat' || data.type === 'traffic') {
        setCurrentAttack(data.data?.threat_type || 'Unknown');
        setLastUpdate(new Date());
        fetchNetworkData();
        getDashboardStats().then(s => s && setStats(s));
        getActiveThreats().then(t => Array.isArray(t) && setThreats(t));
      }
    });
    wsRef.current = ws;
    return () => ws.close();
  }, [fetchNetworkData]);

  const getZoneThreatCount = (zoneKey: string): number => {
    return threats.filter(t => {
      const z = (t.zone || '').toUpperCase();
      return z === zoneKey.toUpperCase() && t.status === 'active';
    }).length;
  };

  const getZoneStatus = (zoneKey: string): LEDStatus => {
    const count = getZoneThreatCount(zoneKey);
    if (count > 0) return 'threat';
    return 'healthy';
  };

  const pieData = ALL_ATTACK_TYPES
    .filter(a => a.key !== 'Benign' && (attackCounts[a.key] || 0) > 0)
    .map(a => ({ name: a.name, value: attackCounts[a.key] || 0, color: a.color }));

  const donutData = pieData.length > 0 ? pieData : [{ name: 'No detections', value: 1, color: '#22c55e' }];
  const attention = threats.filter(t => t.status === 'active' && (t.severity === 'critical' || t.severity === 'high'));
  const devicePct = stats.total_devices ? Math.round((stats.online_devices / stats.total_devices) * 100) : 0;
  const threatLive = currentAttack !== 'Benign' && currentAttack !== 'None';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <ViewShell
      eyebrow="00 · Security Posture"
      title="Network secure."
      titleEm="All systems guarded."
      subtitle={`Live security posture for the hospital IoT estate — ${stats.total_devices} monitored medical devices across ICU, ER, Ward, OR and the data center.`}
      actions={
        <>
          <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: wsConnected ? 'var(--mint)' : 'var(--red)',
              boxShadow: wsConnected ? '0 0 8px var(--mint)' : 'none',
            }} />
            {wsConnected ? 'WS LIVE' : 'CONNECTING'}
          </span>
          <span className={`tag ${threatLive ? 'tag-red' : 'tag-mint'}`}>{currentAttack}</span>
          <span className="tag" style={{ fontFamily: 'var(--font-mono)' }}>{currentTime.toLocaleTimeString()}</span>
        </>
      }
    >
      {/* ---- KPI ROW ---- */}
      <div className="kpi-row">
        <div className="kpi" style={{ ['--kpi-color' as any]: 'var(--cyan)', ['--kpi-soft' as any]: 'var(--cyan-soft)' }}>
          <div className="kpi-top"><div className="kpi-label">Devices Online</div><div className="kpi-badge">{stats.online_devices} / {stats.total_devices}</div></div>
          <div className="kpi-value">{devicePct}<span className="unit">%</span></div>
          <div className="kpi-foot"><span>{stats.total_devices} medical devices · 6 zones</span></div>
        </div>

        <div className="kpi" style={{ ['--kpi-color' as any]: 'var(--red)', ['--kpi-soft' as any]: 'var(--red-soft)' }}>
          <div className="kpi-top"><div className="kpi-label">Active Threats</div><div className="kpi-badge">LIVE</div></div>
          <div className="kpi-value">{stats.active_threats}</div>
          <div className="kpi-foot"><span>{stats.active_threats > 0 ? 'Awaiting triage' : 'All clear'}</span></div>
        </div>

        <div className="kpi" style={{ ['--kpi-color' as any]: 'var(--mint)', ['--kpi-soft' as any]: 'var(--mint-soft)' }}>
          <div className="kpi-top"><div className="kpi-label">Network Health</div><div className="kpi-badge">{stats.network_status === 'secure' ? 'OK' : stats.network_status.toUpperCase()}</div></div>
          <div className="kpi-value">{stats.uptime}</div>
          <div className="kpi-foot"><span>Uptime · status {stats.network_status}</span></div>
        </div>

        <div className="kpi" style={{ ['--kpi-color' as any]: 'var(--amber)', ['--kpi-soft' as any]: 'var(--amber-soft)' }}>
          <div className="kpi-top"><div className="kpi-label">Threats Blocked</div><div className="kpi-badge">TOTAL</div></div>
          <div className="kpi-value">{stats.threats_prevented}</div>
          <div className="kpi-foot"><span>Auto-mitigated</span></div>
        </div>
      </div>

      {/* ---- DASH GRID ---- */}
      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Needs Attention</div><div className="card-sub">Unresolved critical &amp; high</div></div>
            <span className={`tag ${attention.length > 0 ? 'tag-red' : 'tag-active'}`}>{attention.length} open</span>
          </div>
          <div className="threat-list">
            {attention.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '1rem 0' }}>
                No critical or high alerts. Run a simulation to populate.
              </div>
            ) : attention.slice(0, 15).map(t => {
              const act = actInfo(t.status);
              return (
                <div key={t.id} className={`threat-entry ${sevClass(t.severity)}`}>
                  <span className="t-time">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="t-msg">
                    <span className="src">{t.device_name || t.device_id}</span>{' · '}
                    <span className="typ" style={{ color: ATTACK_COLOR_MAP[t.threat_type] || 'var(--text-sub)' }}>{t.threat_type}</span>
                  </span>
                  <span className="t-conf">{Math.round(t.confidence)}%</span>
                  <span className={`t-act ${act.c}`}>{act.l}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Detections · 24h</div><div className="card-sub">By attack class</div></div>
            <span className="tag tag-active">24h</span>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius={78} outerRadius={108} paddingAngle={2} stroke="none">
                  {donutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#11162a' : '#fff', border: '1px solid rgba(180,200,240,0.16)', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center"><div className="n">{pieData.length}</div><div className="l">classes</div></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Throughput</div><div className="card-sub">Packets / sec · 5m</div></div>
            <span className="tag tag-active">{lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="traffic-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData.length > 0 ? trafficData : [{ time: '…', packets: 0, type: 'None' }]}>
                <defs>
                  <linearGradient id="ovTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#222b4d' : '#e5e7eb'} />
                <XAxis dataKey="time" stroke={isDark ? '#5d6783' : '#7a8197'} fontSize={9} interval="preserveStartEnd" />
                <YAxis stroke={isDark ? '#5d6783' : '#7a8197'} fontSize={9} tickFormatter={(v) => `${v}K`} />
                <Tooltip
                  contentStyle={{ backgroundColor: isDark ? '#11162a' : '#fff', border: '1px solid rgba(180,200,240,0.16)', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: any) => [`${value}K pkt/s`, 'Traffic']} />
                <Area type="stepAfter" dataKey="packets" stroke="#06b6d4" strokeWidth={2} fill="url(#ovTraffic)" animationDuration={100} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ---- DEPARTMENT STATUS STRIP ---- */}
      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Department Status</div><div className="card-sub">Live zone health · OMNeT++ reported</div></div>
          <span className="tag tag-active">{HOSPITAL_ZONES.length} zones</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {HOSPITAL_ZONES.map(zone => {
            const status = getZoneStatus(zone.key);
            const count = getZoneThreatCount(zone.key);
            return (
              <div key={zone.key} style={{
                padding: '0.85rem', background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
              }}>
                <div>
                  <div className="stat-label">{zone.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: status === 'threat' ? 'var(--red)' : 'var(--mint)' }}>
                    {status === 'threat' ? `${count} alert${count > 1 ? 's' : ''}` : 'Healthy'}
                  </div>
                </div>
                <StatusLED status={status} size="lg" />
              </div>
            );
          })}
        </div>
      </div>
    </ViewShell>
  );
};

export default Dashboard;
