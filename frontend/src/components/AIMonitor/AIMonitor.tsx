// Detection Engine view - redesigned for AEGIS Command Center
// Wraps the 4 existing AI panels in the new ViewShell + violet accent.
// All hooks live here; results passed down via props (unchanged).
import React from 'react';
import ViewShell from '../Layout/ViewShell';
import AIHealthBadge from './AIHealthBadge';
import AIPredictionStream from './AIPredictionStream';
import EnsembleDecisionViz from './EnsembleDecisionViz';
import AttackClassDistribution from './AttackClassDistribution';
import { useAIWebSocket } from './hooks/useAIWebSocket';

const AIMonitor: React.FC = () => {
  const aiWs = useAIWebSocket();
  const [pinnedPrediction, setPinnedPrediction] = React.useState<any>(null);
  const visualizerTarget = pinnedPrediction || aiWs.latest;

  // Summary stats from the prediction buffer
  const total = aiWs.predictions.length;
  const zeroDays = aiWs.predictions.filter((p) => p.predicted_class === 'ZERO_DAY').length;
  const suspicious = aiWs.predictions.filter((p) => p.predicted_class?.startsWith('SUSPICIOUS')).length;
  const latestClass = aiWs.latest?.predicted_class || '—';

  return (
    <ViewShell
      eyebrow="04 · Detection Engine"
      title="Ensemble AI,"
      titleEm="three models in unison."
      subtitle="Random Forest + CNN-LSTM + Autoencoder · 39 features · CICIoMT2024-trained · ZERO_DAY-aware"
      actions={
        <>
          <span className="tag tag-violet">{aiWs.status === 'connected' ? 'WS LIVE' : (aiWs.status?.toUpperCase() || 'OFFLINE')}</span>
        </>
      }
    >
      {/* Meta strip - quick stats */}
      <div className="detection-meta-strip">
        <span><span className="lbl">Predictions buffered</span> <strong>{total}</strong></span>
        <span className="sep" />
        <span><span className="lbl">ZERO_DAY</span> <strong>{zeroDays}</strong></span>
        <span className="sep" />
        <span><span className="lbl">SUSPICIOUS</span> <strong>{suspicious}</strong></span>
        <span className="sep" />
        <span><span className="lbl">Latest</span> <strong>{latestClass}</strong></span>
      </div>

      {/* Row 1: Health Badge (left) + Prediction Stream (right) */}
      <div className="detection-row row-2">
        <div className="detection-panel accent-left">
          <AIHealthBadge />
        </div>
        <div className="detection-panel">
          <AIPredictionStream
            predictions={aiWs.predictions}
            onSelect={setPinnedPrediction}
            selectedId={pinnedPrediction?.timestamp?.toISOString?.() ?? null}
          />
        </div>
      </div>

      {/* Row 2: Ensemble Decision (left) + Attack Class Distribution (right) */}
      <div className="detection-row row-equal">
        <div className="detection-panel accent-left">
          <EnsembleDecisionViz prediction={visualizerTarget} />
        </div>
        <div className="detection-panel">
          <AttackClassDistribution predictions={aiWs.predictions} />
        </div>
      </div>
    </ViewShell>
  );
};

export default AIMonitor;
