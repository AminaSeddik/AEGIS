// Panel B: Scrolling list of real ai_prediction events from WebSocket.
// Newest first. Per-class color coding. Hover for per-model breakdown.

import React, { useMemo, useState } from 'react';
import type { AIPrediction, PredictedClass } from '../../types/ai';

interface Props {
  predictions: AIPrediction[];
  onSelect?: (p: AIPrediction) => void;
  selectedId?: string | null;
}

// Returns { fg, bg, label } for a predicted_class
const classStyle = (cls: PredictedClass): { fg: string; bg: string; label: string } => {
  if (cls === 'ZERO_DAY')        return { fg: '#a855f7', bg: 'rgba(168,85,247,0.12)', label: 'ZERO_DAY' };
  if (cls.startsWith('SUSPICIOUS_')) return { fg: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: cls };
  if (cls === 'Benign')          return { fg: '#16a34a', bg: 'rgba(22,163,74,0.10)', label: 'Benign' };
  if (cls === 'DDoS')            return { fg: '#dc2626', bg: 'rgba(220,38,38,0.12)', label: 'DDoS' };
  if (cls === 'DoS')             return { fg: '#ea580c', bg: 'rgba(234,88,12,0.12)', label: 'DoS' };
  if (cls === 'ICMP_Flood')      return { fg: '#d97706', bg: 'rgba(217,119,6,0.12)', label: 'ICMP_Flood' };
  if (cls === 'Reconnaissance')  return { fg: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Reconnaissance' };
  return { fg: '#94a3b8', bg: 'rgba(148,163,184,0.10)', label: cls };
};

const timeFmt = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(Math.floor(d.getMilliseconds()/10))}`;
};

// Confidence is 0..1 for known classes, but raw anomaly_score for ZERO_DAY.
// Show a meaningful bar in both cases.
const confidenceDisplay = (p: AIPrediction): { pct: number; label: string } => {
  if (p.is_zero_day) {
    const ratio = p.anomaly_score / Math.max(p.anomaly_threshold, 1e-9);
    return {
      pct: 100, // pegged at full
      label: `anomaly ${p.anomaly_score.toFixed(2)} (${ratio.toExponential(1)}× threshold)`,
    };
  }
  return { pct: Math.max(0, Math.min(100, p.confidence * 100)), label: `${(p.confidence * 100).toFixed(1)}%` };
};

const AIPredictionStream: React.FC<Props> = ({ predictions, onSelect, selectedId }) => {
  const [classFilter, setClassFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('');
  const [hovered, setHovered] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return predictions.filter((p) => {
      if (classFilter !== 'all') {
        if (classFilter === 'ZERO_DAY' && !p.is_zero_day) return false;
        if (classFilter === 'SUSPICIOUS' && !p.is_suspicious) return false;
        if (classFilter === 'KNOWN' && (p.is_zero_day || p.is_suspicious)) return false;
      }
      if (deviceFilter && !(p.device_id || '').toLowerCase().includes(deviceFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [predictions, classFilter, deviceFilter]);

  if (predictions.length === 0) {
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
          LIVE PREDICTION STREAM
        </div>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: '2px solid #94a3b8', borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite', marginBottom: 12,
        }} />
        <div style={{ fontSize: 12 }}>Waiting for AI predictions from backend...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px 20px', borderRadius: 12,
      border: '1px solid rgba(148,163,184,0.2)',
      background: 'rgba(255,255,255,0.03)',
      minHeight: 320, maxHeight: 480, display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 600, color: '#94a3b8' }}>
          LIVE PREDICTION STREAM <span style={{ color: '#16a34a' }}>● {filtered.length} of {predictions.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6,
              background: 'rgba(255,255,255,0.05)', color: 'inherit',
              border: '1px solid rgba(148,163,184,0.3)' }}
          >
            <option value="all">all classes</option>
            <option value="ZERO_DAY">zero-day only</option>
            <option value="SUSPICIOUS">suspicious only</option>
            <option value="KNOWN">known only</option>
          </select>
          <input
            placeholder="device..."
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, width: 100,
              background: 'rgba(255,255,255,0.05)', color: 'inherit',
              border: '1px solid rgba(148,163,184,0.3)' }}
          />
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, fontFamily: 'system-ui, sans-serif' }}>
        {filtered.map((p) => {
          const cs = classStyle(p.predicted_class);
          const conf = confidenceDisplay(p);
          const isSelected = selectedId === p.timestamp.toISOString();
          const isHovered = hovered === p.timestamp.toISOString();
          const isZD = p.is_zero_day;

          return (
            <div
              key={p.timestamp.toISOString() + (p.device_id || '')}
              onClick={() => onSelect?.(p)}
              onMouseEnter={() => setHovered(p.timestamp.toISOString())}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '90px 130px 1fr 70px',
                alignItems: 'center', gap: 12,
                padding: '8px 10px', marginBottom: 4, borderRadius: 8,
                cursor: 'pointer',
                background: isSelected ? 'rgba(99,102,241,0.15)' :
                            isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: isSelected ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                transition: 'background 0.1s',
                animation: isZD ? 'zdpulse 2s ease-in-out infinite' : undefined,
              }}
            >
              <span style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                background: 'rgba(148,163,184,0.15)', color: '#cbd5e1',
                fontFamily: 'monospace', textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {p.device_id || '—'}
              </span>

              <span style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 4,
                background: cs.bg, color: cs.fg, fontWeight: 600,
                textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                backgroundImage: p.is_suspicious
                  ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 8px)'
                  : undefined,
              }}>
                {cs.label}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: 'rgba(148,163,184,0.15)', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${conf.pct}%`, height: '100%',
                    background: cs.fg, transition: 'width 0.2s',
                  }} />
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8', minWidth: 60, textAlign: 'right' }}>
                  {conf.label}
                </span>
              </div>

              <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', textAlign: 'right' }}>
                {timeFmt(p.timestamp)}
              </span>

              {isHovered && (
                <div style={{
                  position: 'absolute', top: '100%', left: 90, zIndex: 50,
                  background: '#0f172a', color: '#e2e8f0',
                  padding: '10px 14px', borderRadius: 8, marginTop: 4,
                  border: '1px solid rgba(148,163,184,0.3)',
                  fontSize: 11, fontFamily: 'monospace',
                  whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  pointerEvents: 'none',
                }}>
                  <div>RF        : {p.rf_class} ({p.rf_confidence.toFixed(4)})</div>
                  <div>CNN-LSTM  : {p.cnn_class} ({p.cnn_confidence.toFixed(4)})</div>
                  <div>Autoencod.: anomaly={p.anomaly_score.toFixed(4)} (thr {p.anomaly_threshold.toFixed(4)})</div>
                  <div style={{ marginTop: 6, color: cs.fg }}>→ Decision: {p.predicted_class}</div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: 11 }}>
            No predictions match the current filter.
          </div>
        )}
      </div>

      <style>{`@keyframes zdpulse {
        0%, 100% { box-shadow: inset 0 0 0 1px transparent; }
        50% { box-shadow: inset 0 0 0 1px rgba(168,85,247,0.5); }
      }`}</style>
    </div>
  );
};

export default AIPredictionStream;
