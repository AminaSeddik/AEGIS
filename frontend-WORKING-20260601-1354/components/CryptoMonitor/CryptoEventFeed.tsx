import React, { useState, useMemo } from 'react';
import { useTheme } from '../../ThemeContext';
import type { CryptoEvent, CryptoEventType, EventSeverity } from '../../types/crypto';

interface Props {
  events: CryptoEvent[];
}

// Severity → color tokens
const SEVERITY_STYLES: Record<EventSeverity, { bar: string; iconBg: string; text: string }> = {
  info:     { bar: 'bg-blue-500',    iconBg: 'bg-blue-500/15',    text: 'text-blue-400' },
  success:  { bar: 'bg-emerald-500', iconBg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  warning:  { bar: 'bg-amber-500',   iconBg: 'bg-amber-500/15',   text: 'text-amber-400' },
  error:    { bar: 'bg-red-500',     iconBg: 'bg-red-500/15',     text: 'text-red-400' },
  critical: { bar: 'bg-red-600',     iconBg: 'bg-red-500/20',     text: 'text-red-500' },
};

const TYPE_LABELS: Record<CryptoEventType, string> = {
  encrypt_ok:        'ENCRYPT',
  decrypt_ok:        'DECRYPT',
  tag_verify_fail:   'TAG FAIL',
  rekey_triggered:   'REKEY',
  session_blocked:   'BLOCKED',
  join_handshake:    'JOIN',
};

const TYPE_ICONS: Record<CryptoEventType, string> = {
  encrypt_ok:        '🔒',
  decrypt_ok:        '🔓',
  tag_verify_fail:   '⚠',
  rekey_triggered:   '🔄',
  session_blocked:   '⛔',
  join_handshake:    '🤝',
};

// Tab options for filtering
type FilterTab = 'all' | 'security' | 'crypto';

const isSecurityEvent = (t: CryptoEventType): boolean =>
  t === 'tag_verify_fail' || t === 'rekey_triggered' || t === 'session_blocked';

const isCryptoEvent = (t: CryptoEventType): boolean =>
  t === 'encrypt_ok' || t === 'decrypt_ok' || t === 'join_handshake';

const formatTime = (d: Date): string => {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  const ms = d.getMilliseconds().toString().padStart(3, '0').slice(0, 2);
  return `${h}:${m}:${s}.${ms}`;
};

const CryptoEventFeed: React.FC<Props> = ({ events }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return events;
    if (filter === 'security') return events.filter((e) => isSecurityEvent(e.type));
    return events.filter((e) => isCryptoEvent(e.type));
  }, [events, filter]);

  const counts = useMemo(() => {
    const security = events.filter((e) => isSecurityEvent(e.type)).length;
    const crypto = events.filter((e) => isCryptoEvent(e.type)).length;
    return { all: events.length, security, crypto };
  }, [events]);

  const cardBg = isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200';
  const labelColor = isDark ? 'text-gray-500' : 'text-slate-500';
  const titleColor = isDark ? 'text-white' : 'text-slate-900';

  const tabClass = (tab: FilterTab, count: number) =>
    `px-3 py-1 rounded-md text-xs font-medium transition-all ${
      filter === tab
        ? isDark
          ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30'
          : 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200'
        : isDark
        ? 'text-gray-400 hover:bg-white/5'
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className={`p-4 rounded-xl border ${cardBg}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${titleColor}`}>
            Live Event Feed
          </h3>
          <span className={`flex items-center gap-1 text-xs ${labelColor}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Streaming
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setFilter('all')} className={tabClass('all', counts.all)}>
            All <span className="opacity-60 ml-1">{counts.all}</span>
          </button>
          <button onClick={() => setFilter('security')} className={tabClass('security', counts.security)}>
            Security <span className="opacity-60 ml-1">{counts.security}</span>
          </button>
          <button onClick={() => setFilter('crypto')} className={tabClass('crypto', counts.crypto)}>
            Crypto <span className="opacity-60 ml-1">{counts.crypto}</span>
          </button>
        </div>
      </div>

      {/* Feed body */}
      <div
        className={`relative overflow-y-auto rounded-lg ${
          isDark ? 'bg-black/20' : 'bg-slate-50/50'
        }`}
        style={{ maxHeight: '380px' }}
      >
        {filtered.length === 0 ? (
          <div className={`p-8 text-center text-sm ${labelColor}`}>
            No events yet. Trigger an attack scenario to see crypto activity.
          </div>
        ) : (
          <div>
            {filtered.slice(0, 100).map((ev) => {
              const style = SEVERITY_STYLES[ev.severity];
              return (
                <div
                  key={ev.id}
                  className={`relative flex items-start gap-3 px-3 py-2 border-b ${
                    isDark ? 'border-gray-800/50' : 'border-slate-100'
                  } hover:${isDark ? 'bg-white/5' : 'bg-slate-100'} transition-colors`}
                >
                  {/* Left severity bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bar}`} />

                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-md ${style.iconBg} flex items-center justify-center text-sm ml-2`}
                  >
                    {TYPE_ICONS[ev.type]}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                        {TYPE_LABELS[ev.type]}
                      </span>
                      <span className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                        {ev.deviceId}
                      </span>
                      {ev.threatClass && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {ev.threatClass}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                      {ev.message}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className={`flex-shrink-0 text-[10px] font-mono pt-1 ${labelColor}`}>
                    {formatTime(ev.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className={`mt-2 flex items-center justify-between text-[10px] ${labelColor}`}>
        <span>Showing {Math.min(filtered.length, 100)} of {filtered.length}</span>
        <span>Buffer: {events.length} / 200</span>
      </div>
    </div>
  );
};

export default CryptoEventFeed;
