import React from 'react';
import { useTheme } from '../../ThemeContext';
import type { CryptoHealth, CryptoBenchmark } from './hooks/useCryptoReal';

interface Props {
  health: CryptoHealth | null;
  benchmark: CryptoBenchmark | null;
  loading: boolean;
  error: string | null;
}

const CryptoTrustBadge: React.FC<Props> = ({ health, benchmark, loading, error }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200';
  const labelColor = isDark ? 'text-gray-500' : 'text-slate-500';
  const titleColor = isDark ? 'text-white' : 'text-slate-900';

  const isHealthy = health?.status === 'healthy';
  const regressionAllPass = health && health.regression_tests.passed === health.regression_tests.total;
  const tamperDetected = health?.tamper_detection.detected === true;
  const fastPathRow = benchmark?.ascon_aegis.find((r) => r.label === '16B');
  const generalPathRow = benchmark?.ascon_aegis.find((r) => r.label === '256B');
  const speedup = fastPathRow && generalPathRow
    ? (generalPathRow.ns_per_op / fastPathRow.ns_per_op).toFixed(2)
    : '—';

  const libSize = health?.library.size_bytes;
  const libMtime = health?.library.mtime
    ? new Date(health.library.mtime * 1000).toLocaleDateString()
    : '—';

  return (
    <div className={`p-5 rounded-xl border ${cardBg}`}>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className={`text-sm font-bold uppercase tracking-wider ${titleColor}`}>
            Cryptographic Trust Badge
          </h3>
          <p className={`text-xs mt-1 ${labelColor}`}>
            Live evidence from the loaded libascon.so — refreshed every 10 seconds
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-500/20 text-red-400">
              BACKEND OFFLINE
            </span>
          )}
          {!error && isHealthy && (
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ✓ HEALTHY
            </span>
          )}
          {!error && !isHealthy && health && (
            <span className="px-2 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ⚠ DEGRADED
            </span>
          )}
          {loading && !health && (
            <span className={`text-xs ${labelColor}`}>loading...</span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error} — start the AEGIS backend with: <code className="font-mono">cd backend && python3 run.py</code> (port 8002)
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Regression vectors */}
        <div className={`p-3 rounded-lg ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${labelColor}`}>Regression Vectors</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-mono font-bold ${regressionAllPass ? 'text-emerald-400' : 'text-amber-400'}`}>
              {health ? `${health.regression_tests.passed}/${health.regression_tests.total}` : '—'}
            </span>
            <span className={`text-xs ${labelColor}`}>passing</span>
          </div>
          {health && (
            <div className={`mt-2 text-[10px] ${labelColor}`}>
              Covers: {health.regression_tests.vectors.map((v) => v.label).join(' · ')}
            </div>
          )}
        </div>

        {/* Tamper detection */}
        <div className={`p-3 rounded-lg ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${labelColor}`}>Tamper Detection</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-mono font-bold ${tamperDetected ? 'text-emerald-400' : 'text-red-400'}`}>
              {tamperDetected ? '✓' : '✗'}
            </span>
            <span className={`text-xs ${labelColor}`}>
              {tamperDetected ? 'verified' : 'failed'}
            </span>
          </div>
          <div className={`mt-2 text-[10px] ${labelColor}`}>
            1-byte XOR of ciphertext correctly rejected on decrypt
          </div>
        </div>

        {/* Library metadata */}
        <div className={`p-3 rounded-lg ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${labelColor}`}>Native Library</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
              {libSize ? (libSize / 1024).toFixed(1) : '—'}
            </span>
            <span className={`text-xs ${labelColor}`}>KB</span>
          </div>
          <div className={`mt-2 text-[10px] font-mono ${labelColor}`}>
            libascon.so · built {libMtime}
          </div>
        </div>

        {/* Fast-path speedup */}
        <div className={`p-3 rounded-lg ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
          <div className={`text-[10px] uppercase tracking-wider ${labelColor}`}>Fast Path vs 256B</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-mono font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {speedup}×
            </span>
            <span className={`text-xs ${labelColor}`}>faster</span>
          </div>
          <div className={`mt-2 text-[10px] ${labelColor}`}>
            {fastPathRow ? `16B: ${fastPathRow.ns_per_op} ns/op` : '—'}
          </div>
        </div>
      </div>

      {/* Detail strip: backend, params, throughput */}
      {health && (
        <div className={`mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs ${labelColor}`}>
          <div>
            <div className="uppercase tracking-wider text-[10px]">Algorithm</div>
            <div className={`mt-0.5 font-mono ${titleColor}`}>{health.algorithm}</div>
          </div>
          <div>
            <div className="uppercase tracking-wider text-[10px]">Key / Nonce / Tag</div>
            <div className={`mt-0.5 font-mono ${titleColor}`}>
              {health.key_bits} / {health.nonce_bits} / {health.tag_bits} bits
            </div>
          </div>
          <div>
            <div className="uppercase tracking-wider text-[10px]">Best throughput</div>
            <div className={`mt-0.5 font-mono ${titleColor}`}>
              {benchmark
                ? `${Math.max(...benchmark.ascon_aegis.map((r) => r.throughput_mbps)).toFixed(1)} Mbps`
                : '—'}
            </div>
          </div>
          <div>
            <div className="uppercase tracking-wider text-[10px]">Source</div>
            <div className={`mt-0.5 font-mono ${titleColor}`}>aegis_ascon_wrapper.c</div>
          </div>
        </div>
      )}

      {/* Benchmark detail rows */}
      {benchmark && (
        <div className="mt-4">
          <div className={`text-[10px] uppercase tracking-wider mb-2 ${labelColor}`}>
            Latency by payload (live benchmark, {benchmark.iterations} iterations)
          </div>
          <div className="space-y-1.5">
            {benchmark.ascon_aegis.map((row) => {
              const maxNs = Math.max(...benchmark.ascon_aegis.map((r) => r.ns_per_op));
              const pct = (row.ns_per_op / maxNs) * 100;
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <div className={`w-12 text-xs font-mono ${labelColor}`}>{row.label}</div>
                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
                    <div
                      className={`h-full ${row.fast_path_eligible ? 'bg-emerald-500' : 'bg-blue-500'} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className={`w-24 text-right text-xs font-mono ${titleColor}`}>
                    {row.ns_per_op.toLocaleString()} ns
                  </div>
                  <div className={`w-20 text-right text-[10px] ${labelColor}`}>
                    {row.throughput_mbps} Mbps
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoTrustBadge;
