const API_BASE = 'http://localhost:8000';
const WS_BASE = 'ws://localhost:8000';

// Cache to reduce API calls
let statsCache = { data: null, timestamp: 0 };
let threatsCache = { data: null, timestamp: 0 };
const CACHE_DURATION = 2000; // 2 seconds cache

// Dashboard Stats (with caching)
export const getDashboardStats = async () => {
  const now = Date.now();
  if (statsCache.data && (now - statsCache.timestamp) < CACHE_DURATION) {
    return statsCache.data;
  }
  try {
    const response = await fetch(`${API_BASE}/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    const data = await response.json();
    statsCache = { data, timestamp: now };
    return data;
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return statsCache.data || {
      network_status: 'secure',
      active_threats: 0,
      online_devices: 85,
      total_devices: 85,
      threats_prevented: 0,
      uptime: '99.97%',
    };
  }
};

// Active Threats (with caching)
export const getActiveThreats = async () => {
  const now = Date.now();
  if (threatsCache.data && (now - threatsCache.timestamp) < CACHE_DURATION) {
    return threatsCache.data;
  }
  try {
    const response = await fetch(`${API_BASE}/dashboard/threats`);
    if (!response.ok) throw new Error('Failed to fetch threats');
    const data = await response.json();
    threatsCache = { data, timestamp: now };
    return data;
  } catch (error) {
    console.error('getActiveThreats error:', error);
    return threatsCache.data || [];
  }
};

// System Stats (for header)
export const getSystemStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/system-stats`);
    if (!response.ok) throw new Error('Failed');
    return await response.json();
  } catch (error) {
    return { cpu_percent: 0, memory_percent: 0, memory_used_gb: 0, network_speed_mbps: 0 };
  }
};

// Block Threat
export const blockThreat = async (threatId: number) => {
  const response = await fetch(`${API_BASE}/threats/${threatId}/block`, { method: 'POST' });
  threatsCache.timestamp = 0; // Invalidate cache
  return await response.json();
};

// Investigate Threat
export const investigateThreat = async (threatId: number) => {
  const response = await fetch(`${API_BASE}/threats/${threatId}/investigate`, { method: 'POST' });
  threatsCache.timestamp = 0; // Invalidate cache
  return await response.json();
};

// WebSocket with real-time data
export const createWebSocket = (onMessage: (data: any) => void) => {
  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  
  const connect = () => {
    try {
      ws = new WebSocket(`${WS_BASE}/ws`);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        reconnectAttempts = 0;
        // Invalidate caches on reconnect
        statsCache.timestamp = 0;
        threatsCache.timestamp = 0;
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'threat') {
            // Invalidate cache when new threat arrives
            threatsCache.timestamp = 0;
            statsCache.timestamp = 0;
          }
          onMessage(data);
        } catch (error) {
          console.error('WebSocket parse error:', error);
        }
      };
      
      ws.onclose = () => {
        if (reconnectAttempts < 5) {
          reconnectAttempts++;
          setTimeout(connect, 3000);
        }
      };
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  };
  
  connect();
  return { close: () => ws?.close() };
};
