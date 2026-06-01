import React from 'react';
import { useTheme } from '../../ThemeContext';
import type { CryptoDevice } from '../../types/crypto';

interface Props {
  device: CryptoDevice;
}

const DEPT_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  ICU:  { bg: 'bg-rose-500/15',    text: 'text-rose-400',    ring: 'ring-rose-500/30' },
  ER:   { bg: 'bg-orange-500/15',  text: 'text-orange-400',  ring: 'ring-orange-500/30' },
  Ward: { bg: 'bg-sky-500/15',     text: 'text-sky-400',     ring: 'ring-sky-500/30' },
  OR:   { bg: 'bg-violet-500/15',  text: 'text-violet-400',  ring: 'ring-violet-500/30' },
};

const THREAT_COLORS: Record<string, { dot: string; text: string; ring: string; pulse: boolean }> = {
  NONE:     { dot: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/40', pulse: false },
  LOW:      { dot: 'bg-yellow-500',  text: 'text-yellow-400',  ring: 'ring-yellow-500/40',  pulse: false },
  MEDIUM:   { dot: 'bg-orange-500',  text: 'text-orange-400',  ring: 'ring-orange-500/40',  pulse: false },
  HIGH:     { dot: 'bg-red-500',     text: 'text-red-400',     ring: 'ring-red-500/40',     pulse: false },
  CRITICAL: { dot: 'bg-red-600',     text: 'text-red-500',     ring: 'ring-red-500/60',     pulse: true  },
};

const SESSION_BADGE: Record<string, { label: string; cls: string }> = {
  ACTIVE:     { label: 'ACTIVE',     cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  REKEYING:   { label: 'REKEYING',   cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' },
  BLOCKED:    { label: 'BLOCKED',    cls: 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' },
  NOT_JOINED: { label: 'JOINING...', cls: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
};

const formatRekey = (d: Date | null): string => {
  if (!d) return 'Never';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
};

const DeviceCryptoCard: React.FC<Props> = ({ device }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const dept = DEPT_COLORS[device.department];
  const threat = THREAT_COLORS[device.threatState];
  const session = SESSION_BADGE[device.sessionState];

  // Outer ring: department color when normal, threat color when escalated
  const outerRing = device.threatState === 'NONE' ? dept.ring : threat.ring;

  return (
    <div
      className={`
        relative p-4 rounded-xl border ring-1 ${outerRing}
        ${isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200'}
        ${threat.pulse ? 'animate-pulse' : ''}
        transition-all duration-300
      `}
    >
      {/* Top row: dept badge + session state */}
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${dept.bg} ${dept.text}`}>
          {device.department}
        </span>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${session.cls}`}>
          {session.label}
        </span>
      </div>

      {/* Device ID — the headline */}
      <div className={`font-mono text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {device.deviceId}
      </div>
      <div className={`font-mono text-[10px] mb-3 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
        {device.patientId}
      </div>

      {/* Threat state row */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full ${threat.dot} ${threat.pulse ? 'animate-ping' : ''}`} />
        <span className={`text-xs font-semibold ${threat.text}`}>
          {device.threatState}
        </span>
      </div>

      {/* Packet counter — live ticking number */}
      <div className="flex items-baseline justify-between mt-3">
        <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
          Packets
        </span>
        <span className={`font-mono text-base font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
          {device.packetCounter.toLocaleString()}
        </span>
      </div>

      {/* Last rekey */}
      <div className="flex items-baseline justify-between mt-1">
        <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
          Last rekey
        </span>
        <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
          {formatRekey(device.lastRekey)}
        </span>
      </div>
    </div>
  );
};

export default DeviceCryptoCard;
