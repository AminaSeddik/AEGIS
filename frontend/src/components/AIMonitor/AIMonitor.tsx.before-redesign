// "AI + Crypto Pipeline" page.
// Top: AI Classification layer (Health Badge + 4 AI panels)
// Bottom: Crypto Response layer (existing CryptoMonitor)
// Hooks called ONCE here, results passed down via props.

import React from 'react';
import AIHealthBadge from './AIHealthBadge';
import AIPredictionStream from './AIPredictionStream';
import EnsembleDecisionViz from './EnsembleDecisionViz';
import AttackClassDistribution from './AttackClassDistribution';
import CryptoMonitor from '../CryptoMonitor/CryptoMonitor';
import { useAIWebSocket } from './hooks/useAIWebSocket';

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 1.5,
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  marginBottom: 12,
};

const placeholderCard = (label: string, hint: string): React.CSSProperties => ({
  padding: 20,
  borderRadius: 12,
  border: '1px dashed rgba(148,163,184,0.3)',
  background: 'rgba(255,255,255,0.02)',
  minHeight: 180,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94a3b8',
  fontFamily: 'system-ui, sans-serif',
});

const AIMonitor: React.FC = () => {
  // NOTE: hooks live here so AIHealthBadge gets the same instances Panels B/C/D will use later
  const aiWs = useAIWebSocket();
  const [pinnedPrediction, setPinnedPrediction] = React.useState<any>(null);
  const visualizerTarget = pinnedPrediction || aiWs.latest;

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, margin: 0, marginBottom: 4 }}>AI + Crypto Pipeline</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
          Live view: AI ensemble classification on top, real ASCON-128 response layer below.
        </p>
      </div>

      {/* ====== CLASSIFICATION LAYER ====== */}
      <div style={sectionTitle}>Classification Layer</div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, marginBottom: 24 }}>
        {/* Panel A — left column */}
        <AIHealthBadge />

        {/* Panel B - real */}
        <AIPredictionStream predictions={aiWs.predictions} onSelect={setPinnedPrediction} selectedId={pinnedPrediction?.timestamp?.toISOString?.() ?? null} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 36 }}>
        {/* Panel C - real */}
        <EnsembleDecisionViz prediction={visualizerTarget} />

        {/* Panel D - real */}
        <AttackClassDistribution predictions={aiWs.predictions} />
      </div>

      {/* ====== RESPONSE LAYER ====== */}
      <div style={sectionTitle}>Response Layer · Encryption + IDS-coupled rekey</div>
      <CryptoMonitor />
    </div>
  );
};

export default AIMonitor;
