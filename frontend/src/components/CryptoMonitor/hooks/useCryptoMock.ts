import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AttackClass,
  CryptoDevice,
  CryptoEvent,
  CryptoEventType,
  Department,
  EventSeverity,
  MetricsSnapshot,
  SessionState,
  ThreatState,
} from '../../../types/crypto';

const DEPARTMENTS: Department[] = ['ICU', 'ER', 'Ward', 'OR'];

const uid = (() => {
  let n = 0;
  return () => `${Date.now().toString(36)}-${(++n).toString(36)}`;
})();

const randHex = (bytes: number) =>
  Array.from({ length: bytes }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const severityForEvent = (type: CryptoEventType): EventSeverity => {
  switch (type) {
    case 'encrypt_ok':
    case 'decrypt_ok':
      return 'success';
    case 'join_handshake':
      return 'info';
    case 'tag_verify_fail':
      return 'warning';
    case 'rekey_triggered':
      return 'warning';
    case 'session_blocked':
      return 'critical';
  }
};

const messageFor = (type: CryptoEventType, deviceId: string, attack?: AttackClass): string => {
  switch (type) {
    case 'encrypt_ok':       return `Packet sealed (AAD bound)`;
    case 'decrypt_ok':       return `Packet verified and decrypted`;
    case 'tag_verify_fail':  return `Tag mismatch - possible tampering${attack ? ` (${attack})` : ''}`;
    case 'rekey_triggered':  return `Session rekey triggered by IDS`;
    case 'session_blocked':  return `Session blocked - CRITICAL threat`;
    case 'join_handshake':   return `3-msg join handshake completed`;
  }
};

const initialDevices = (): CryptoDevice[] => {
  const devices: CryptoDevice[] = [];
  for (const dept of DEPARTMENTS) {
    for (let i = 1; i <= 3; i++) {
      const id = `${dept}-${i.toString().padStart(3, '0')}`;
      devices.push({
        id,
        deviceId: id,
        patientId: `PT-${randHex(2).toUpperCase()}`,
        department: dept,
        sessionState: 'ACTIVE',
        threatState: 'NONE',
        packetCounter: Math.floor(Math.random() * 5000) + 1000,
        lastRekey: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
        fastPathRatio: 0.6 + Math.random() * 0.3,
      });
    }
  }
  devices[1].sessionState = 'REKEYING';
  devices[5].threatState = 'LOW';
  devices[9].sessionState = 'NOT_JOINED';
  return devices;
};

const MAX_EVENTS = 200;
const MAX_METRICS = 60;

export function useCryptoMock() {
  const [devices, setDevices] = useState<CryptoDevice[]>(initialDevices);
  const [events, setEvents] = useState<CryptoEvent[]>([]);
  const [metrics, setMetrics] = useState<MetricsSnapshot[]>([]);
  const scenariosRef = useRef<Map<string, number>>(new Map());

  const pushEvent = useCallback(
    (type: CryptoEventType, deviceId: string, attack?: AttackClass) => {
      const ev: CryptoEvent = {
        id: uid(),
        timestamp: new Date(),
        type,
        deviceId,
        threatClass: attack,
        severity: severityForEvent(type),
        message: messageFor(type, deviceId, attack),
      };
      setEvents((prev) => [ev, ...prev].slice(0, MAX_EVENTS));
    },
    []
  );

  const updateDevice = useCallback(
    (deviceId: string, patch: Partial<CryptoDevice>) => {
      setDevices((prev) =>
        prev.map((d) => (d.deviceId === deviceId ? { ...d, ...patch } : d))
      );
    },
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      let pps = 0;
      let fast = 0;
      let general = 0;
      let failures = 0;

      setDevices((prev) =>
        prev.map((d) => {
          if (d.sessionState !== 'ACTIVE') return d;
          const packetsThisTick = Math.floor(Math.random() * 6) + 3;
          pps += packetsThisTick;
          const fastHere = Math.floor(packetsThisTick * d.fastPathRatio);
          fast += fastHere;
          general += packetsThisTick - fastHere;
          if (d.threatState === 'HIGH' || d.threatState === 'CRITICAL') {
            failures += Math.floor(Math.random() * 4) + 1;
          } else if (d.threatState === 'MEDIUM') {
            failures += Math.random() < 0.4 ? 1 : 0;
          }
          return { ...d, packetCounter: d.packetCounter + packetsThisTick };
        })
      );

      const scaled: MetricsSnapshot = {
        t: Date.now(),
        packetsPerSecond: pps * 5,
        fastPathCount: fast * 5,
        generalPathCount: general * 5,
        tagVerifyFailures: failures * 5,
        medianCyclesPerPacket: 142 + Math.floor((Math.random() - 0.5) * 30),
      };
      setMetrics((prev) => [...prev, scaled].slice(-MAX_METRICS));

      if (Math.random() < 0.4) {
        const activeDevs = devices.filter((d) => d.sessionState === 'ACTIVE');
        if (activeDevs.length > 0) {
          const target = pick(activeDevs);
          pushEvent(Math.random() < 0.5 ? 'encrypt_ok' : 'decrypt_ok', target.deviceId);
        }
      }
      const elevated = devices.filter(
        (d) => d.threatState === 'HIGH' || d.threatState === 'CRITICAL'
      );
      if (elevated.length > 0 && Math.random() < 0.6) {
        const target = pick(elevated);
        pushEvent('tag_verify_fail', target.deviceId);
      }
    }, 200);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, pushEvent]);

  const triggerAttack = useCallback(
    (deviceId: string, attackClass: AttackClass): Promise<void> => {
      return new Promise((resolve) => {
        const schedule = (delay: number, fn: () => void) => {
          const handle = window.setTimeout(fn, delay);
          scenariosRef.current.set(`${deviceId}-${delay}`, handle);
        };

        const setThreat = (s: ThreatState) => updateDevice(deviceId, { threatState: s });
        const setSession = (s: SessionState) => updateDevice(deviceId, { sessionState: s });

        schedule(0, () => {
          setThreat('LOW');
          pushEvent('tag_verify_fail', deviceId, attackClass);
        });
        schedule(1000, () => {
          setThreat('MEDIUM');
          pushEvent('tag_verify_fail', deviceId, attackClass);
          pushEvent('tag_verify_fail', deviceId, attackClass);
        });
        schedule(2500, () => {
          setThreat('HIGH');
          pushEvent('tag_verify_fail', deviceId, attackClass);
        });
        schedule(3000, () => {
          setSession('REKEYING');
          pushEvent('rekey_triggered', deviceId, attackClass);
        });
        schedule(3500, () => pushEvent('join_handshake', deviceId));
        schedule(3700, () => pushEvent('join_handshake', deviceId));
        schedule(3900, () => pushEvent('join_handshake', deviceId));
        schedule(5000, () => {
          updateDevice(deviceId, {
            sessionState: 'ACTIVE',
            threatState: 'NONE',
            lastRekey: new Date(),
          });
          resolve();
        });
      });
    },
    [pushEvent, updateDevice]
  );

  const reset = useCallback(() => {
    scenariosRef.current.forEach((handle) => window.clearTimeout(handle));
    scenariosRef.current.clear();
    setDevices(initialDevices());
    setEvents([]);
    setMetrics([]);
  }, []);

  return { devices, events, metrics, triggerAttack, reset };
}
