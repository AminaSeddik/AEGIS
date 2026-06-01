// Real-backend hook for the crypto session manager.
// Polls /api/crypto/sessions every 1s for state snapshots.
// Opens WebSocket /ws/crypto for live event stream.
// Returns the SAME shape as useCryptoMock so panels swap with one line.

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CryptoDevice,
  CryptoEvent,
  Department,
  SessionState,
  ThreatState,
  CryptoEventType,
  EventSeverity,
  AttackClass,
} from '../../../types/crypto';

const BACKEND_BASE = 'http://localhost:8002';
const WS_URL = 'ws://localhost:8002/ws/crypto';

interface BackendSession {
  device_id: string;
  patient_id: string;
  department: string;
  session_state: string;
  threat_state: string;
  packet_counter: number;
  fast_path_count: number;
  general_path_count: number;
  fast_path_ratio: number;
  tag_fail_count: number;
  attack_class: string | null;
  last_rekey: string;
}

interface BackendEvent {
  id: string;
  timestamp: string;
  type: string;
  device_id: string;
  threat_class: string | null;
  severity: string;
  message: string;
}

const toDevice = (s: BackendSession): CryptoDevice => ({
  id: s.device_id,
  deviceId: s.device_id,
  patientId: s.patient_id,
  department: s.department as Department,
  sessionState: s.session_state as SessionState,
  threatState: s.threat_state as ThreatState,
  packetCounter: s.packet_counter,
  lastRekey: s.last_rekey ? new Date(s.last_rekey) : null,
  fastPathRatio: s.fast_path_ratio,
});

const toEvent = (e: BackendEvent): CryptoEvent => ({
  id: e.id,
  timestamp: new Date(e.timestamp),
  type: e.type as CryptoEventType,
  deviceId: e.device_id,
  threatClass: (e.threat_class as AttackClass | null) ?? undefined,
  severity: e.severity as EventSeverity,
  message: e.message,
});

export function useCryptoSessions() {
  const [devices, setDevices] = useState<CryptoDevice[]>([]);
  const [events, setEvents] = useState<CryptoEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ---- Sessions polling ----
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/crypto/sessions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDevices(data.sessions.map(toDevice));
      setConnected(true);
      setError(null);
    } catch (e: any) {
      setConnected(false);
      setError(e.message || 'Backend unreachable');
    }
  }, []);

  // ---- Events bootstrap + WebSocket ----
  const fetchEventsBootstrap = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/crypto/events?limit=100`);
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events.map(toEvent));
    } catch {
      /* ignore — WS will fill it */
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchEventsBootstrap();
    const id = setInterval(fetchSessions, 1000);
    return () => clearInterval(id);
  }, [fetchSessions, fetchEventsBootstrap]);

  // ---- WebSocket for live events ----
  useEffect(() => {
    let alive = true;
    const connect = () => {
      if (!alive) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onmessage = (msg) => {
        try {
          const payload = JSON.parse(msg.data);
          if (payload && payload.type && payload.device_id) {
            const ev = toEvent(payload as BackendEvent);
            setEvents((prev) => [ev, ...prev].slice(0, 200));
          }
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        if (alive) setTimeout(connect, 2000);
      };
      ws.onerror = () => {
        try { ws.close(); } catch {}
      };
    };
    connect();
    return () => {
      alive = false;
      wsRef.current?.close();
    };
  }, []);

  // ---- Actions: real backend calls ----
  const triggerAttack = useCallback(
    async (deviceId: string, attackClass: AttackClass): Promise<void> => {
      try {
        await fetch(`${BACKEND_BASE}/api/crypto/sessions/${deviceId}/attack`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attack_class: attackClass }),
        });
      } catch (e: any) {
        setError(e.message || 'Attack injection failed');
      }
    },
    []
  );

  const reset = useCallback(async () => {
    try {
      await fetch(`${BACKEND_BASE}/api/crypto/sessions/reset`, { method: 'POST' });
      await fetchSessions();
      setEvents([]);
    } catch (e: any) {
      setError(e.message || 'Reset failed');
    }
  }, [fetchSessions]);

  // metrics shim: derive a minimal MetricsSnapshot list for compatibility with mock contract
  // (the real metrics panel pulls from useCryptoReal already)
  const metrics: any[] = [];

  return { devices, events, metrics, triggerAttack, reset, connected, error };
}
