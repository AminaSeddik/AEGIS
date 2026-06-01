import React from 'react';
import ViewShell from '../Layout/ViewShell';
import { useCryptoSessions } from './hooks/useCryptoSessions';
import { useCryptoReal } from './hooks/useCryptoReal';

// Map department code -> display label
const DEPT_LABEL: Record<string, string> = {
  ICU: 'ICU', ER: 'ER', Ward: 'Ward', OR: 'OR',
  DataCenter: 'DC', Core: 'Core',
};

// Format time-ago for last_rekey
function timeAgo(d: Date | null): string {
  if (!d) return '—';
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const FLOW_STEPS = [
  {
    n: 'i.',
    title: 'Initialization',
    text: 'IV ∥ K ∥ N loaded into 320-bit state; 12-round permutation applied — increased from spec for medical context.',
  },
  {
    n: 'ii.',
    title: 'Domain-Specific AD',
    text: 'Device ID, department code, patient session token absorbed as Associated Data — binds ciphertext to hospital context.',
  },
  {
    n: 'iii.',
    title: 'Hybrid Nonce',
    text: 'Nonce = HW serial ⊕ timestamp ⊕ session counter — prevents replay even across reboots and broker failovers.',
  },
  {
    n: 'iv.',
    title: 'Dynamic Key Rotation',
    text: 'Session key rotated every N messages or T seconds; rotation event signed by gateway and ACK\'d by the device.',
  },
  {
    n: 'v.',
    title: 'Finalization & Auth Tag',
    text: 'Final permutation produces 128-bit tag; verified by gateway — any tampering aborts the message before AI inference.',
  },
];

const CryptoMonitor: React.FC = () => {
  const { devices, events, triggerAttack, reset } = useCryptoSessions();
  const real = useCryptoReal();

  const totalDevices = devices.length;
  const activeDevices = devices.filter((d) => d.sessionState === 'ACTIVE').length;
  const elevatedDevices = devices.filter((d) => d.threatState !== 'NONE').length;

  // Find a target device for the demo button
  const demoTarget =
    devices.find((d) => d.deviceId === 'medicalDataServer')?.deviceId ||
    devices.find((d) => d.sessionState === 'ACTIVE')?.deviceId ||
    null;

  return (
    <ViewShell
      eyebrow="06 · Crypto Health"
      title="ASCON-128,"
      titleEm="native & lightweight."
      subtitle={`${activeDevices}/${totalDevices} sessions active · ${elevatedDevices} under elevated threat · libascon.so loaded`}
      actions={
        <>
          <button className="btn" onClick={() => reset()}>Reset</button>
          {demoTarget && (
            <button
              className="btn btn-primary"
              onClick={() => triggerAttack(demoTarget, 'MQTT_Attack' as any)}
            >
              ▶ Trigger Attack on {demoTarget}
            </button>
          )}
        </>
      }
    >
      {/* Trust Badge row */}
      <div className="crypto-stats-row">
        <div className={`crypto-stat-card ${real.health?.regression_tests?.passed === real.health?.regression_tests?.total ? 'ok' : 'fail'}`}>
          <div className="lbl">Regression Vectors</div>
          <div className="val">
            {real.health ? `${real.health.regression_tests.passed}/${real.health.regression_tests.total}` : '—'}
            <span className="unit">passing</span>
          </div>
          <div className="sub">1B · 8B · 16B · 17B · 32B · 64B · 256B</div>
        </div>

        <div className={`crypto-stat-card ${real.health?.tamper_detection?.detected ? 'ok' : 'fail'}`}>
          <div className="lbl">Tamper Detection</div>
          <div className="val">
            {real.health?.tamper_detection?.detected ? '✓' : '✗'}
            <span className="unit">{real.health?.tamper_detection?.detected ? 'verified' : 'failed'}</span>
          </div>
          <div className="sub">XOR-corrupt rejected on decrypt</div>
        </div>

        <div className="crypto-stat-card">
          <div className="lbl">Native Library</div>
          <div className="val">
            {real.health ? (real.health.library.size_bytes / 1024).toFixed(1) : '—'}
            <span className="unit">KB</span>
          </div>
          <div className="sub">libascon.so · {real.health?.algorithm || 'ASCON-128'}</div>
        </div>

        <div className="crypto-stat-card">
          <div className="lbl">Key / Nonce / Tag</div>
          <div className="val">
            128 / 128 / 128<span className="unit">bits</span>
          </div>
          <div className="sub">NIST SP 800-232 parameter sizes</div>
        </div>
      </div>

      {/* Flow + Event Feed */}
      <div className="crypto-grid">
        <div className="crypto-flow-panel">
          <div className="card-head" style={{ paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
            <div>
              <div className="card-title">AEGIS-ASCON Custom Variant</div>
              <div className="card-sub">Medical-domain extensions</div>
            </div>
            <span className="tag tag-active">LIVE</span>
          </div>
          {FLOW_STEPS.map((s) => (
            <div className="flow-step" key={s.n}>
              <div className="flow-n">{s.n}</div>
              <div>
                <strong>{s.title}</strong>
                <span>{s.text}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="event-feed">
          <div className="card-head" style={{ paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
            <div>
              <div className="card-title">Live Event Stream</div>
              <div className="card-sub">WebSocket · /ws/crypto</div>
            </div>
            <span className="tag tag-active">{events.length}</span>
          </div>
          {events.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Waiting for crypto events…
            </div>
          ) : (
            events.slice(0, 60).map((e) => (
              <div className="event-row" key={e.id}>
                <span className={`ev-type ${e.type}`}>{e.type.replace(/_/g, ' ')}</span>
                <span className="ev-device">{e.deviceId}</span>
                <span className="ev-msg">{e.message}</span>
                <span className="ev-ts">{
                  e.timestamp.toLocaleTimeString('en-GB', { hour12: false })
                }</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Session grid */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="card-head">
          <div>
            <div className="card-title">Active Sessions</div>
            <div className="card-sub">{totalDevices} devices · real os.urandom(16) keys · traffic-driven rekey</div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <span className="tag tag-mint">{activeDevices} ACTIVE</span>
            {elevatedDevices > 0 && <span className="tag tag-red">{elevatedDevices} ELEVATED</span>}
          </div>
        </div>

        <div className="session-grid">
          {devices.map((d) => {
            const threatClass =
              d.sessionState === 'REKEYING' ? 'rekeying' :
              d.threatState === 'LOW'      ? 'threat-low'     :
              d.threatState === 'MEDIUM'   ? 'threat-medium'  :
              d.threatState === 'HIGH'     ? 'threat-high'    :
              d.threatState === 'CRITICAL' ? 'threat-critical': '';
            const threatLabel =
              d.sessionState === 'REKEYING' ? 'REKEYING' :
              d.threatState === 'NONE'      ? 'SECURE'   : d.threatState;
            return (
              <div className={`session-cell ${threatClass}`} key={d.deviceId}>
                <div className="sc-head">
                  <span className="sc-id">{d.deviceId}</span>
                  <span className="sc-dept">{DEPT_LABEL[d.department] || d.department}</span>
                </div>
                <div className="sc-stats">
                  <span className="sc-pkts">{d.packetCounter.toLocaleString()} pkts</span>
                  <span className="sc-threat">{threatLabel}</span>
                </div>
                <div className="sc-stats" style={{ marginTop: '0.3rem' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.6rem' }}>
                    last rekey {timeAgo(d.lastRekey)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ViewShell>
  );
};

export default CryptoMonitor;
