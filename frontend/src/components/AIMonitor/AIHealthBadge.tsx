// Panel A: Compact AI Ensemble status badge.
// Shows 3 model dots (RF / CNN-LSTM / AE), connection status, and stats subtitle.
// Click to open the full health JSON in a modal.

import React, { useState } from 'react';
import { useAIHealth } from './hooks/useAIHealth';
import { useAIWebSocket } from './hooks/useAIWebSocket';
import type { ConnectionStatus } from '../../types/ai';

const dotStyle = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: color,
  marginRight: 6,
  boxShadow: `0 0 4px ${color}`,
});

const wsColor = (s: ConnectionStatus): string => {
  if (s === 'connected') return '#16a34a';
  if (s === 'reconnecting' || s === 'connecting') return '#eab308';
  return '#dc2626';
};

const wsLabel = (s: ConnectionStatus): string => {
  if (s === 'connected') return 'Live';
  if (s === 'reconnecting') return 'Reconnecting';
  if (s === 'connecting') return 'Connecting';
  return 'Disconnected';
};

const AIHealthBadge: React.FC = () => {
  const { health, loading, error } = useAIHealth();
  const { status: wsStatus, predictions } = useAIWebSocket();
  const [showModal, setShowModal] = useState(false);

  // Resolve the high-level state
  const ensembleReady = health?.ready === true;
  const allLoaded = health?.models_loaded
    ? Object.values(health.models_loaded).every(Boolean)
    : false;
  const headlineColor = ensembleReady && allLoaded ? '#16a34a' : error || !health ? '#dc2626' : '#eab308';
  const headlineLabel = !health
    ? error ? 'OFFLINE' : 'CHECKING...'
    : ensembleReady && allLoaded
      ? 'ONLINE'
      : 'PARTIAL';

  const modelDot = (label: string, loaded: boolean | undefined) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, marginRight: 12 }}>
      <span style={dotStyle(loaded ? '#16a34a' : '#94a3b8')} />
      <span style={{ color: loaded ? 'inherit' : '#94a3b8' }}>{label}</span>
    </span>
  );

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        style={{
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid rgba(148,163,184,0.2)',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(8px)',
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
          minWidth: 280,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={dotStyle(headlineColor)} />
            <strong style={{ fontSize: 13, letterSpacing: 0.4 }}>AI ENSEMBLE: {headlineLabel}</strong>
          </div>
          <span style={{ fontSize: 10, color: wsColor(wsStatus) }}>
            <span style={dotStyle(wsColor(wsStatus))} />
            {wsLabel(wsStatus)}
          </span>
        </div>

        <div style={{ marginBottom: 6 }}>
          {modelDot('RF', health?.models_loaded?.random_forest)}
          {modelDot('CNN-LSTM', health?.models_loaded?.cnn_lstm)}
          {modelDot('Autoencoder', health?.models_loaded?.autoencoder)}
        </div>

        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          {health
            ? `${health.known_classes.length} known classes · ${health.feature_count} features · ${predictions.length} live predictions`
            : error
              ? `Error: ${error}`
              : loading
                ? 'Polling /api/ai/health...'
                : 'No data yet'}
        </div>
      </div>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0f172a', color: '#e2e8f0',
              padding: 24, borderRadius: 16, maxWidth: 560, width: '90%',
              maxHeight: '80vh', overflow: 'auto',
              border: '1px solid rgba(148,163,184,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>AI Ensemble Health</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', color: 'inherit', border: 'none', fontSize: 18, cursor: 'pointer' }}
              >×</button>
            </div>
            <pre style={{ fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0 }}>
              {health ? JSON.stringify(health, null, 2) : (error ?? 'No data yet')}
            </pre>
          </div>
        </div>
      )}
    </>
  );
};

export default AIHealthBadge;
