// Panel D: Pie chart of attack class distribution over last 5 minutes.
// 7 buckets: 5 known classes + ZERO_DAY + SUSPICIOUS_*
// Alert badge if ZERO_DAY > 5% of recent traffic.

import React, { useMemo } from 'react';
import type { AIPrediction } from '../../types/ai';

interface Props {
  predictions: AIPrediction[];
  windowSeconds?: number;
}

const BUCKET_COLORS: Record<string, string> = {
  Benign:         '#16a34a',
  DDoS:           '#dc2626',
  DoS:            '#ea580c',
  ICMP_Flood:     '#d97706',
  Reconnaissance: '#f97316',
  SUSPICIOUS:     '#f59e0b',
  ZERO_DAY:       '#a855f7',
};

const BUCKET_ORDER = ['Benign', 'DDoS', 'DoS', 'ICMP_Flood', 'Reconnaissance', 'SUSPICIOUS', 'ZERO_DAY'];

const bucketize = (p: AIPrediction): string => {
  if (p.is_zero_day) return 'ZERO_DAY';
  if (p.is_suspicious) return 'SUSPICIOUS';
  return p.predicted_class;
};

const Donut: React.FC<{ buckets: { name: string; count: number }[]; total: number }> = ({ buckets, total }) => {
  const radius = 65;
  const stroke = 22;
  const cx = 90, cy = 90;
  const circ = 2 * Math.PI * radius;

  let cumulative = 0;
  const segments = buckets
    .filter((b) => b.count > 0)
    .map((b) => {
      const frac = b.count / total;
      const dash = frac * circ;
      const gap = circ - dash;
      const offset = -cumulative * circ;
      cumulative += frac;
      return { ...b, dash, gap, offset };
    });

  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      <circle cx={cx} cy={cy} r={radius} fill="none"
              stroke="rgba(148,163,184,0.10)" strokeWidth={stroke} />
      {segments.map((s) => (
        <circle
          key={s.name} cx={cx} cy={cy} r={radius} fill="none"
          stroke={BUCKET_COLORS[s.name] || '#64748b'} strokeWidth={stroke}
          strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={s.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'all 0.4s' }}
        />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={20} fontWeight={700} fill="#e2e8f0">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9} fill="#94a3b8" letterSpacing={1}>
        EVENTS
      </text>
    </svg>
  );
};

const AttackClassDistribution: React.FC<Props> = ({ predictions, windowSeconds = 300 }) => {
  const { buckets, total, zdPercent } = useMemo(() => {
    const cutoff = Date.now() - windowSeconds * 1000;
    const recent = predictions.filter((p) => p.timestamp.getTime() >= cutoff);

    const counts: Record<string, number> = {};
    for (const name of BUCKET_ORDER) counts[name] = 0;
    for (const p of recent) {
      const b = bucketize(p);
      counts[b] = (counts[b] || 0) + 1;
    }
    const t = recent.length;
    const zd = t > 0 ? (counts['ZERO_DAY'] / t) * 100 : 0;
    const bucketList = BUCKET_ORDER.map((name) => ({ name, count: counts[name] }));
    return { buckets: bucketList, total: t, zdPercent: zd };
  }, [predictions, windowSeconds]);

  if (total === 0) {
    return (
      <div style={{
        padding: 24, borderRadius: 12,
        border: '1px dashed rgba(148,163,184,0.3)',
        background: 'rgba(255,255,255,0.02)',
        minHeight: 320, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: '#94a3b8', fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 1.5, marginBottom: 12, fontWeight: 600 }}>
          ATTACK CLASS DISTRIBUTION
        </div>
        <div style={{ fontSize: 12 }}>No prediction data yet</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px 20px', borderRadius: 12,
      border: '1px solid rgba(148,163,184,0.2)',
      background: 'rgba(255,255,255,0.03)',
      minHeight: 320, fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 600, color: '#94a3b8' }}>
          ATTACK CLASS DISTRIBUTION <span style={{ color: '#64748b' }}>· last {Math.round(windowSeconds / 60)}m</span>
        </div>
        {zdPercent > 5 && (
          <span style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 4,
            background: 'rgba(168,85,247,0.15)', color: '#a855f7',
            fontWeight: 600, animation: 'zdflash 1.5s ease-in-out infinite',
          }}>
            ⚠ Unusual zero-day activity ({zdPercent.toFixed(1)}%)
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'center' }}>
        <Donut buckets={buckets} total={total} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {buckets.map((b) => {
            const pct = total > 0 ? (b.count / total) * 100 : 0;
            const color = BUCKET_COLORS[b.name] || '#64748b';
            return (
              <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-block', width: 10, height: 10, borderRadius: 2,
                  background: color, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 11, color: b.count > 0 ? '#e2e8f0' : '#64748b',
                  minWidth: 110, fontFamily: 'monospace',
                }}>
                  {b.name === 'SUSPICIOUS' ? 'SUSPICIOUS_*' : b.name}
                </span>
                <div style={{ flex: 1, height: 4, background: 'rgba(148,163,184,0.10)', borderRadius: 2 }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: color, borderRadius: 2, transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8', minWidth: 60, textAlign: 'right' }}>
                  {b.count} ({pct.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes zdflash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }`}</style>
    </div>
  );
};

export default AttackClassDistribution;
