// Panel C: 3 model cards (RF | CNN-LSTM | Autoencoder) showing how the ensemble decision was reached.
// Pinned to the most recent prediction or one selected from Panel B.

import React from 'react';
import type { AIPrediction } from '../../types/ai';

interface Props {
  prediction: AIPrediction | null;
}

const card: React.CSSProperties = {
  padding: 16, borderRadius: 12,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(255,255,255,0.03)',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  gap: 8, minHeight: 180,
};

const cardLabel: React.CSSProperties = {
  fontSize: 10, letterSpacing: 1.5, fontWeight: 600,
  color: '#94a3b8', textTransform: 'uppercase',
};

// SVG donut for confidence (0..1)
const ConfidenceDonut: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  const radius = 32;
  const stroke = 8;
  const norm = Math.max(0, Math.min(1, value));
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - norm);
  return (
    <svg width={80} height={80} style={{ overflow: 'visible' }}>
      <circle
        cx={40} cy={40} r={radius}
        stroke="rgba(148,163,184,0.15)" strokeWidth={stroke} fill="none"
      />
      <circle
        cx={40} cy={40} r={radius}
        stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 0.4s' }}
      />
      <text
        x={40} y={44} textAnchor="middle"
        fontSize={14} fontWeight={600} fill={color}
      >
        {(norm * 100).toFixed(1)}%
      </text>
    </svg>
  );
};

// Horizontal gauge for anomaly score vs threshold
const AnomalyGauge: React.FC<{ score: number; threshold: number }> = ({ score, threshold }) => {
  // log-scale visualization since anomaly can be huge
  const logRatio = Math.log10(Math.max(score / Math.max(threshold, 1e-9), 0.01));
  // map -2..6 (i.e., 0.01x .. 1e6x threshold) → 0..100%
  const pct = Math.max(0, Math.min(100, ((logRatio + 2) / 8) * 100));
  const dangerStart = ((0 + 2) / 8) * 100; // where ratio = 1.0
  const above = score > threshold;

  return (
    <div style={{ width: '100%', marginTop: 4 }}>
      <div style={{
        position: 'relative', height: 20, borderRadius: 4,
        background: 'rgba(148,163,184,0.12)', overflow: 'hidden',
      }}>
        {/* Danger zone background */}
        <div style={{
          position: 'absolute', top: 0, left: `${dangerStart}%`,
          width: `${100 - dangerStart}%`, height: '100%',
          background: 'rgba(220,38,38,0.10)',
        }} />
        {/* Threshold marker */}
        <div style={{
          position: 'absolute', top: -2, left: `${dangerStart}%`,
          width: 2, height: 24, background: '#f59e0b',
        }} />
        {/* Score indicator */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: `${pct}%`, height: '100%',
          background: above ? '#dc2626' : '#16a34a',
          transition: 'width 0.4s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#64748b', marginTop: 4 }}>
        <span>0.01×</span>
        <span style={{ color: '#f59e0b' }}>threshold</span>
        <span>10⁶×</span>
      </div>
      <div style={{ fontSize: 11, color: above ? '#dc2626' : '#16a34a', textAlign: 'center', marginTop: 4 }}>
        {score.toFixed(2)} {above ? '⚠ ABOVE threshold' : '✓ below threshold'}
      </div>
    </div>
  );
};

const decisionRuleText = (p: AIPrediction): string => {
  const classifiersAgree = p.rf_class === p.cnn_class;
  const anomaly = p.anomaly_score > p.anomaly_threshold;
  if (anomaly && !classifiersAgree) return `AE anomaly = TRUE, classifiers DISAGREE (RF=${p.rf_class}, CNN=${p.cnn_class}) → ZERO_DAY`;
  if (anomaly && classifiersAgree) return `AE anomaly = TRUE, classifiers AGREE on ${p.rf_class} → ${p.predicted_class}`;
  if (!anomaly && classifiersAgree) return `AE anomaly = FALSE, classifiers AGREE on ${p.rf_class} → ${p.predicted_class}`;
  const winner = p.rf_confidence > p.cnn_confidence ? `RF (${p.rf_class})` : `CNN (${p.cnn_class})`;
  return `AE anomaly = FALSE, classifiers DISAGREE → higher confidence wins: ${winner}`;
};

const EnsembleDecisionViz: React.FC<Props> = ({ prediction }) => {
  if (!prediction) {
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
          ENSEMBLE DECISION VISUALIZER
        </div>
        <div style={{ fontSize: 12 }}>Awaiting first prediction...</div>
      </div>
    );
  }

  const decisionColor =
    prediction.is_zero_day ? '#a855f7' :
    prediction.is_suspicious ? '#f59e0b' :
    prediction.predicted_class === 'Benign' ? '#16a34a' :
    '#dc2626';

  return (
    <div style={{
      padding: '16px 20px', borderRadius: 12,
      border: '1px solid rgba(148,163,184,0.2)',
      background: 'rgba(255,255,255,0.03)',
      minHeight: 320, fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 600, color: '#94a3b8' }}>
          ENSEMBLE DECISION VISUALIZER
        </div>
        <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
          device {prediction.device_id || '—'}
        </span>
      </div>

      {/* Three model cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={card}>
          <div style={cardLabel}>Random Forest</div>
          <ConfidenceDonut value={prediction.rf_confidence} color="#3b82f6" />
          <div style={{ fontSize: 12, fontWeight: 600 }}>{prediction.rf_class}</div>
        </div>

        <div style={card}>
          <div style={cardLabel}>CNN-LSTM</div>
          <ConfidenceDonut value={prediction.cnn_confidence} color="#0ea5e9" />
          <div style={{ fontSize: 12, fontWeight: 600 }}>{prediction.cnn_class}</div>
        </div>

        <div style={card}>
          <div style={cardLabel}>Autoencoder</div>
          <AnomalyGauge score={prediction.anomaly_score} threshold={prediction.anomaly_threshold} />
          <div style={{ fontSize: 10, color: '#64748b' }}>
            thr {prediction.anomaly_threshold.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Decision flow */}
      <div style={{
        padding: '12px 14px', borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${decisionColor}40`,
        borderLeft: `4px solid ${decisionColor}`,
      }}>
        <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: 1, marginBottom: 6 }}>
          ENSEMBLE DECISION RULE
        </div>
        <div style={{ fontSize: 12, color: '#e2e8f0', marginBottom: 8, fontFamily: 'monospace' }}>
          {decisionRuleText(prediction)}
        </div>
        <div style={{ fontSize: 14, color: decisionColor, fontWeight: 700 }}>
          → {prediction.predicted_class}
        </div>
      </div>
    </div>
  );
};

export default EnsembleDecisionViz;
