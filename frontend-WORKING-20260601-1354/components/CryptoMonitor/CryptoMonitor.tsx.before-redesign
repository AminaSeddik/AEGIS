import React from 'react';
import { useTheme } from '../../ThemeContext';
import { useCryptoSessions } from './hooks/useCryptoSessions';
import DeviceCryptoCard from './DeviceCryptoCard';
import CryptoMetrics from './CryptoMetrics';
import CryptoEventFeed from './CryptoEventFeed';
import CryptoTrustBadge from './CryptoTrustBadge';
import { useCryptoReal } from './hooks/useCryptoReal';
import type { Department } from '../../types/crypto';

const DEPT_LABELS: Record<Department, string> = {
  ICU:  'Intensive Care',
  ER:   'Emergency Room',
  Ward: 'General Ward',
  OR:   'Operating Rooms',
};

const CryptoMonitor: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { devices, events, metrics, triggerAttack, reset } = useCryptoSessions();
  const real = useCryptoReal();

  // Latest snapshot for the headline numbers
  const latest = metrics[metrics.length - 1];
  const totalPps = latest?.packetsPerSecond ?? 0;
  const totalDevices = devices.length;
  const activeDevices = devices.filter((d) => d.sessionState === 'ACTIVE').length;
  const elevatedDevices = devices.filter(
    (d) => d.threatState !== 'NONE'
  ).length;

  // Group devices by department for the visual rhythm
  const departments: Department[] = ['ICU', 'ER', 'Ward', 'OR'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Crypto Monitor
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Live encryption layer status across all medical IoT sessions
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Packets / sec
            </div>
            <div className={`text-2xl font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
              {totalPps.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Active Sessions
            </div>
            <div className={`text-2xl font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {activeDevices} / {totalDevices}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Elevated
            </div>
            <div className={`text-2xl font-mono font-bold ${elevatedDevices > 0 ? 'text-red-500 animate-pulse' : (isDark ? 'text-gray-400' : 'text-slate-500')}`}>
              {elevatedDevices}
            </div>
          </div>
        </div>
      </div>

      {/* Real backend trust evidence */}
      <CryptoTrustBadge health={real.health} benchmark={real.benchmark} loading={real.loading} error={real.error} />

      {/* Real-time metrics row */}
      <CryptoMetrics stream={real.stream} streamHistory={real.streamHistory} benchmark={real.benchmark?.ascon_aegis ?? null} loading={real.loading} error={real.error} />

      {/* Per-department device grid */}
      {departments.map((dept) => {
        const deptDevices = devices.filter((d) => d.department === dept);
        const deptActive = deptDevices.filter((d) => d.sessionState === 'ACTIVE').length;
        const deptRekeying = deptDevices.filter((d) => d.sessionState === 'REKEYING').length;
        const deptAlert = deptDevices.filter((d) => d.threatState !== 'NONE').length;

        return (
          <div key={dept}>
            {/* Department header with aggregate */}
            <div className="flex items-baseline justify-between mb-3">
              <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                {DEPT_LABELS[dept]} <span className={`ml-2 text-xs font-normal ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>({dept})</span>
              </h2>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                <span className="text-emerald-500">{deptActive} ACTIVE</span>
                {deptRekeying > 0 && <span className="ml-2 text-amber-500">{deptRekeying} REKEYING</span>}
                {deptAlert > 0 && <span className="ml-2 text-red-500">{deptAlert} ALERT</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {deptDevices.map((d) => (
                <DeviceCryptoCard key={d.id} device={d} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Live event feed */}
      <CryptoEventFeed events={events} />

      {/* Temp diagnostics — we'll replace this with real panels in next steps */}
      <div className={`p-4 rounded-xl border text-xs ${isDark ? 'bg-[#0d1424] border-gray-800 text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
        <strong>Build status:</strong> Phase 1/4 complete (device cards). Next: real-time metrics, event feed, trust badge, demo console.<br />
        Events buffered: <span className="font-mono">{events.length}</span> · Metrics snapshots: <span className="font-mono">{metrics.length}</span>
      </div>

      {/* Tiny demo trigger for development — replaced by full console later */}
      <div className="flex gap-2">
        <button
          onClick={() => triggerAttack('ICU-001', 'MQTT_Attack')}
          className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium"
        >
          ▶ Trigger MQTT Attack on ICU-001
        </button>
        <button
          onClick={reset}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
        >
          ⟲ Reset
        </button>
      </div>
    </div>
  );
};

export default CryptoMonitor;
