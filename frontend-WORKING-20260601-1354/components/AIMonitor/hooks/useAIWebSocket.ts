// Subscribes to ws://localhost:8002/ws, filters for event_type === 'ai_prediction'.
// Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, ..., max 30s).
// Maintains a ring buffer of recent predictions (newest first).

import { useEffect, useRef, useState, useCallback } from 'react';
import type { AIPrediction, AIPredictionRaw, ConnectionStatus } from '../../../types/ai';

const WS_URL = 'ws://localhost:8002/ws';
const MAX_PREDICTIONS = 200;
const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

export function useAIWebSocket() {
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef<number>(INITIAL_BACKOFF_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aliveRef = useRef<boolean>(true);

  const parsePrediction = (raw: AIPredictionRaw): AIPrediction => ({
    ...raw,
    timestamp: new Date(raw.timestamp),
  });

  const connect = useCallback(() => {
    if (!aliveRef.current) return;
    setStatus(prev => (prev === 'disconnected' ? 'reconnecting' : 'connecting'));

    let ws: WebSocket;
    try {
      ws = new WebSocket(WS_URL);
    } catch {
      scheduleReconnect();
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      backoffRef.current = INITIAL_BACKOFF_MS;
      setStatus('connected');
    };

    ws.onmessage = (msg) => {
      try {
        const payload = JSON.parse(msg.data);
        if (payload?.event_type === 'ai_prediction') {
          const parsed = parsePrediction(payload as AIPredictionRaw);
          setPredictions((prev) => [parsed, ...prev].slice(0, MAX_PREDICTIONS));
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      try { ws.close(); } catch {}
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (aliveRef.current) {
        setStatus('reconnecting');
        scheduleReconnect();
      } else {
        setStatus('disconnected');
      }
    };
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!aliveRef.current) return;
    const delay = Math.min(backoffRef.current, MAX_BACKOFF_MS);
    backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
    reconnectTimerRef.current = setTimeout(connect, delay);
  }, [connect]);

  useEffect(() => {
    aliveRef.current = true;
    connect();
    return () => {
      aliveRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      try { wsRef.current?.close(); } catch {}
      setStatus('disconnected');
    };
  }, [connect]);

  const latest = predictions[0] ?? null;
  const reload = useCallback(() => {
    try { wsRef.current?.close(); } catch {}
  }, []);

  return { predictions, status, latest, reload };
}
