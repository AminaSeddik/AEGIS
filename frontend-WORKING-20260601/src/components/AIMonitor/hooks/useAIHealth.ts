// Polls /api/ai/health every 5 seconds. Honest: returns null health on failure.
import { useEffect, useState, useCallback } from 'react';
import type { AIHealth } from '../../../types/ai';

const HEALTH_URL = 'http://localhost:8002/api/ai/health';
const POLL_INTERVAL_MS = 5000;
const FETCH_TIMEOUT_MS = 5000;

export function useAIHealth() {
  const [health, setHealth] = useState<AIHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(HEALTH_URL, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AIHealth = await res.json();
      setHealth(data);
      setError(null);
    } catch (e: any) {
      clearTimeout(timeout);
      setHealth(null);
      setError(e.message || 'AI backend unreachable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchHealth]);

  return { health, loading, error, reload: fetchHealth };
}
