// Real backend hook — polls the actual AEGIS crypto endpoints on port 8002.
// Returns the same shape as useCryptoMock so panels swap with one line.

import { useCallback, useEffect, useRef, useState } from 'react';

const CRYPTO_BASE = 'http://localhost:8002';

export interface CryptoHealth {
  status: string;
  algorithm: string;
  key_bits: number;
  nonce_bits: number;
  tag_bits: number;
  library: {
    path: string;
    exists: boolean;
    size_bytes: number;
    mtime: number;
  };
  regression_tests: {
    total: number;
    passed: number;
    failed: number;
    failures: Array<{ vector: string; reason: string }>;
    vectors: Array<{ label: string; size: number; fast_path: boolean }>;
  };
  tamper_detection: {
    executed: boolean;
    detected: boolean;
  };
}

export interface BenchmarkRow {
  label: string;
  payload_bytes: number;
  iterations: number;
  ns_per_op: number;
  ops_per_sec: number;
  throughput_mbps: number;
  fast_path_eligible: boolean;
}

export interface CryptoBenchmark {
  iterations: number;
  ascon_aegis: BenchmarkRow[];
  hmac_sha256_baseline: Array<{ label: string; ns_per_op: number }>;
  note: string;
}

export interface TestStream {
  samples_per_payload: number;
  counters: {
    encrypt_ok: number;
    decrypt_ok: number;
    tag_verify_fail: number;
    fast_path: number;
    general_path: number;
    total_bytes: number;
  };
  by_payload: Array<{
    label: string;
    size: number;
    fast_path: boolean;
    samples: number;
    success: number;
    success_rate: number;
  }>;
}

export interface RealCryptoData {
  health: CryptoHealth | null;
  benchmark: CryptoBenchmark | null;
  stream: TestStream | null;
  streamHistory: TestStream[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  reload: () => void;
}

export function useCryptoReal(streamPollMs = 2500): RealCryptoData {
  const [health, setHealth] = useState<CryptoHealth | null>(null);
  const [benchmark, setBenchmark] = useState<CryptoBenchmark | null>(null);
  const [stream, setStream] = useState<TestStream | null>(null);
  const [streamHistory, setStreamHistory] = useState<TestStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const mounted = useRef(true);

  const fetchHealth = useCallback(async () => {
    try {
      const r = await fetch(`${CRYPTO_BASE}/api/crypto/health`);
      if (!r.ok) throw new Error(`Health HTTP ${r.status}`);
      const data: CryptoHealth = await r.json();
      if (mounted.current) {
        setHealth(data);
        setError(null);
      }
    } catch (e: any) {
      if (mounted.current) setError(e.message || 'Health fetch failed');
    }
  }, []);

  const fetchBenchmark = useCallback(async () => {
    try {
      const r = await fetch(`${CRYPTO_BASE}/api/crypto/benchmark?iterations=200`);
      if (!r.ok) throw new Error(`Benchmark HTTP ${r.status}`);
      const data: CryptoBenchmark = await r.json();
      if (mounted.current) setBenchmark(data);
    } catch (e: any) {
      if (mounted.current) setError(e.message || 'Benchmark fetch failed');
    }
  }, []);

  const fetchStream = useCallback(async () => {
    try {
      const r = await fetch(`${CRYPTO_BASE}/api/crypto/test-stream?samples=30`);
      if (!r.ok) throw new Error(`Stream HTTP ${r.status}`);
      const data: TestStream = await r.json();
      if (mounted.current) {
        setStream(data);
        setStreamHistory((prev) => [...prev, data].slice(-30));
        setLastUpdate(new Date());
      }
    } catch (e: any) {
      if (mounted.current) setError(e.message || 'Stream fetch failed');
    }
  }, []);

  const reload = useCallback(() => {
    fetchHealth();
    fetchBenchmark();
    fetchStream();
  }, [fetchHealth, fetchBenchmark, fetchStream]);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      await Promise.all([fetchHealth(), fetchBenchmark(), fetchStream()]);
      if (mounted.current) setLoading(false);
    })();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic refresh: stream every streamPollMs, health every 10s
  useEffect(() => {
    const streamTimer = setInterval(fetchStream, streamPollMs);
    const healthTimer = setInterval(fetchHealth, 10_000);
    return () => {
      clearInterval(streamTimer);
      clearInterval(healthTimer);
    };
  }, [fetchHealth, fetchStream, streamPollMs]);

  return { health, benchmark, stream, streamHistory, loading, error, lastUpdate, reload };
}
