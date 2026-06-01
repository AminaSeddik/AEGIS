// AI Ensemble types - mirror the backend /api/ai/* contract.

export type KnownClass = 'Benign' | 'DDoS' | 'DoS' | 'ICMP_Flood' | 'Reconnaissance';

// Predicted class can be a known one, a suspicious variant, or ZERO_DAY
export type PredictedClass = KnownClass | 'ZERO_DAY' | `SUSPICIOUS_${string}`;

export interface AIHealth {
  ready: boolean;
  model_dir: string;
  models_loaded: {
    random_forest: boolean;
    cnn_lstm: boolean;
    autoencoder: boolean;
    scaler: boolean;
    label_encoder: boolean;
  };
  known_classes: KnownClass[];
  feature_count: number;
  anomaly_threshold: number;
  load_error: string | null;
}

export interface AIPrediction {
  event_type: 'ai_prediction';
  timestamp: Date;                    // parsed from ISO 8601 string
  predicted_class: PredictedClass;
  confidence: number;
  is_zero_day: boolean;
  is_suspicious: boolean;
  rf_class: string;
  rf_confidence: number;
  cnn_class: string;
  cnn_confidence: number;
  anomaly_score: number;
  anomaly_threshold: number;
  device_id: string | null;
}

// Raw shape as received from WebSocket (timestamp is still a string here)
export interface AIPredictionRaw extends Omit<AIPrediction, 'timestamp'> {
  timestamp: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
