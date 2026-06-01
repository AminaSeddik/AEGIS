// Network Device Types
export interface Device {
  id: string;
  name: string;
  type: 'monitor' | 'pump' | 'scanner' | 'ventilator' | 'other';
  status: 'normal' | 'warning' | 'threat';
  location: string;
  ipAddress: string;
  lastSeen: string;
}

// Threat Types
export interface Threat {
  id: string;
  timestamp: string;
  type: 'ddos' | 'data_exfiltration' | 'ransomware' | 'normal';
  deviceId: string;
  deviceName: string;
  location: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'blocked' | 'investigating';
  description: string;
}

// Network Stats
export interface NetworkStats {
  timestamp: number;
  totalPackets: number;
  totalBytes: number;
  avgPacketSize: number;
  tcpUdpRatio: number;
  activeDevices: number;
  threats: number;
  blockedThreats: number;
}

// Dashboard Metrics
export interface DashboardMetrics {
  networkStatus: 'secure' | 'warning' | 'threat';
  activeThreats: number;
  onlineDevices: number;
  totalDevices: number;
  threatsPrevented: number;
  uptime: string;
}