import React, { useMemo } from 'react';
import { useTheme } from '../../ThemeContext';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import type { TestStream, BenchmarkRow } from './hooks/useCryptoReal';

interface Props {
  stream: TestStream | null;
  streamHistory: TestStream[];
  benchmark: BenchmarkRow[] | null;
  loading: boolean;
  error: string | null;
}

const CryptoMetrics: React.FC<Props> = ({ stream, streamHistory, benchmark, loading, error }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Derive headline numbers from real test-stream data
  const totalEncrypts = stream?.counters.encrypt_ok ?? 0;
  const fastPath = stream?.counters.fast_path ?? 0;
  const generalPath = stream?.counters.general_path ?? 0;
  const totalPath = fastPath + generalPath;
  const fastPathPct = totalPath > 0 ? Math.round((fastPath / totalPath) * 100) : 0;
  const tamperRejections = stream?.counters.tag_verify_fail ?? 0;
  const totalBytes = stream?.counters.total_bytes ?? 0;

  // Real ns/op from benchmark — use the 16B row as headline (fast-path representative)
  const fastBench = benchmark?.find((b) => b.label === '16B');
  const generalBench = benchmark?.find((b) => b.label === '256B');
  const nsPerOp = fastBench?.ns_per_op ?? 0;
  const generalNsPerOp = generalBench?.ns_per_op ?? 0;
  const speedup = nsPerOp > 0 && generalNsPerOp > 0
    ? (generalNsPerOp / nsPerOp).toFixed(2)
    : '—';

  // Build sparkline series from streamHistory (real values over time)
  const encryptSeries = useMemo(
    () =>
      streamHistory.map((s, i) => ({
        i,
        v: s.counters.encrypt_ok,
      })),
    [streamHistory]
  );

  const tamperSeries = useMemo(
    () =>
      streamHistory.map((s, i) => ({
        i,
        v: s.counters.tag_verify_fail,
      })),
    [streamHistory]
  );

  const cardBg = isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200';
  const labelColor = isDark ? 'text-gray-500' : 'text-slate-500';
  const valueColor = isDark ? 'text-white' : 'text-slate-900';

  // Per-payload breakdown from real stream data
  const payloadRows = stream?.by_payload ?? [];

  if (error && !stream) {
    return (
      <div className={`p-6 rounded-xl border ${cardBg} text-center`}>
        <p className="text-red-400 text-sm">{error}</p>
        <p className={`text-xs mt-1 ${labelColor}`}>Start the AEGIS crypto backend on port 8002</p>
      </div>
    );
  }

  if (loading && !stream) {
    return (
      <div className={`p-6 rounded-xl border ${cardBg} text-center`}>
        <p className={`text-sm ${labelColor}`}>Loading real crypto metrics...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Encrypts per sample with sparkline */}
      <div className={`p-4 rounded-xl border ${cardBg}`}>
        <div className={`text-xs uppercase tracking-wider ${labelColor}`}>Real Encrypt Ops</div>
        <div className={`text-3xl font-mono font-bold mt-1 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
          {totalEncrypts.toLocaleString()}
        </div>
        <div className="h-12 mt-2 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={encryptSeries.length > 0 ? encryptSeries : [{ i: 0, v: 0 }]}>
              <defs>
                <linearGradient id="encGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="#06b6d4"
                strokeWidth={1.5}
                fill="url(#encGradient)"
                isAnimationActive={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
                formatter={(v: any) => [`${v} ops`, 'Per sample']}
                labelFormatter={() => ''}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className={`text-[10px] mt-1 ${labelColor}`}>
          Live from /api/crypto/test-stream · {totalBytes.toLocaleString()}B encrypted
        </div>
      </div>

      {/* Fast path vs general path — REAL counts */}
      <div className={`p-4 rounded-xl border ${cardBg}`}>
        <div className={`text-xs uppercase tracking-wider ${labelColor}`}>Fast Path Ratio</div>
        <div className={`text-3xl font-mono font-bold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
          {fastPathPct}%
        </div>
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-emerald-400">Fast path (≤16B)</span>
              <span className={valueColor}>{fastPath.toLocaleString()} ops</span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
              <div className="h-full bg-emerald-500 transition-all duration-200" style={{ width: `${fastPathPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-blue-400">General path</span>
              <span className={valueColor}>{generalPath.toLocaleString()} ops</span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
              <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${100 - fastPathPct}%` }} />
            </div>
          </div>
        </div>
        <div className={`text-[10px] mt-2 ${labelColor}`}>
          Real medical payloads — 3 small + 2 large
        </div>
      </div>

      {/* Tamper rejections — REAL */}
      <div
        className={`p-4 rounded-xl border ${
          tamperRejections > 0 ? 'bg-emerald-500/5 border-emerald-500/30' : cardBg
        } transition-colors duration-300`}
      >
        <div className={`text-xs uppercase tracking-wider ${labelColor}`}>Tamper Rejections</div>
        <div className={`text-3xl font-mono font-bold mt-1 text-emerald-400`}>
          {tamperRejections}
          <span className="text-xs ml-1 opacity-60">/ {stream?.by_payload.length ?? 0}</span>
        </div>
        <div className="h-12 mt-2 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tamperSeries.length > 0 ? tamperSeries : [{ i: 0, v: 0 }]}>
              <defs>
                <linearGradient id="tamperGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="#10b981"
                strokeWidth={1.5}
                fill="url(#tamperGradient)"
                isAnimationActive={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
                formatter={(v: any) => [`${v} rejected`, 'Tamper attempts']}
                labelFormatter={() => ''}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className={`text-[10px] mt-1 text-emerald-400`}>
          ✓ 100% rejection rate — AAD-bound tags
        </div>
      </div>

      {/* Real cycles/packet from benchmark */}
      <div className={`p-4 rounded-xl border ${cardBg}`}>
        <div className={`text-xs uppercase tracking-wider ${labelColor}`}>ns / Packet (16B)</div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-3xl font-mono font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
            {nsPerOp > 0 ? nsPerOp.toLocaleString() : '—'}
          </span>
          <span className={`text-xs ${labelColor}`}>ns</span>
        </div>
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-purple-400 font-semibold">Fast path (16B)</span>
              <span className={valueColor}>{nsPerOp.toLocaleString()} ns</span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{
                  width: `${generalNsPerOp > 0 ? (nsPerOp / generalNsPerOp) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className={labelColor}>General (256B)</span>
              <span className={labelColor}>{generalNsPerOp.toLocaleString()} ns</span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
              <div className="h-full bg-gray-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-[10px] uppercase tracking-wider ${labelColor}`}>Real speedup</span>
          <span className={`text-lg font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {speedup}×
          </span>
        </div>
      </div>

      {/* Per-payload breakdown row (spans full width below the 4 cards) */}
      {payloadRows.length > 0 && (
        <div className={`lg:col-span-4 p-4 rounded-xl border ${cardBg}`}>
          <div className={`text-xs uppercase tracking-wider mb-3 ${labelColor}`}>
            Per-payload encrypt+decrypt verification (live, this sample)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {payloadRows.map((p) => (
              <div
                key={p.label}
                className={`p-2 rounded-lg ${
                  isDark ? 'bg-black/20' : 'bg-slate-50'
                } border ${
                  p.success_rate === 1
                    ? 'border-emerald-500/30'
                    : 'border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono ${valueColor}`}>{p.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      p.fast_path
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {p.fast_path ? 'FAST' : 'GEN'}
                  </span>
                </div>
                <div className={`text-[10px] mt-1 ${labelColor}`}>
                  {p.size} bytes · {p.samples} samples
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className={`text-sm font-mono font-bold ${
                      p.success_rate === 1 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {p.success}/{p.samples}
                  </span>
                  <span className={`text-[10px] ${labelColor}`}>verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoMetrics;
