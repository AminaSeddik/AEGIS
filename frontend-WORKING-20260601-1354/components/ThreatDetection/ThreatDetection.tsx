import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../ThemeContext';

interface Threat {
  id: number;
  timestamp: string;
  threat_type: string;
  severity: string;
  confidence: number;
  device_id: string;
  device_name: string;
  status: string;
  description: string;
  source_ip?: string;
  destination_ip?: string;
  packets?: number;
  bytes?: number;
}

const ALL_ATTACK_TYPES = [
  { key: 'ddos', name: 'DDoS', color: '#ef4444', icon: '⚡', bg: 'bg-red-500' },
  { key: 'dos', name: 'DoS', color: '#f97316', icon: '🔥', bg: 'bg-orange-500' },
  { key: 'icmp_flood', name: 'ICMP Flood', color: '#06b6d4', icon: '🌊', bg: 'bg-cyan-500' },
  { key: 'arp_spoofing', name: 'ARP Spoofing', color: '#10b981', icon: '🎭', bg: 'bg-emerald-500' },
  { key: 'mqtt_attack', name: 'MQTT Attack', color: '#ec4899', icon: '📡', bg: 'bg-pink-500' },
  { key: 'ransomware', name: 'Ransomware', color: '#8b5cf6', icon: '🔒', bg: 'bg-purple-500' },
  { key: 'reconnaissance', name: 'Reconnaissance', color: '#6366f1', icon: '🔍', bg: 'bg-indigo-500' },
  { key: 'data_exfiltration', name: 'Data Exfiltration', color: '#f59e0b', icon: '📤', bg: 'bg-amber-500' },
];

const SAMPLE_DEVICES = [
  { id: 'DEV-001', name: 'Patient Monitor ICU-1', zone: 'ICU' },
  { id: 'DEV-002', name: 'Ventilator ICU-2', zone: 'ICU' },
  { id: 'DEV-003', name: 'Infusion Pump ER-1', zone: 'ER' },
  { id: 'DEV-004', name: 'ECG Monitor Ward-1', zone: 'Ward' },
  { id: 'DEV-005', name: 'MRI Scanner Lab-1', zone: 'Radiology' },
  { id: 'DEV-006', name: 'CT Scanner Radiology', zone: 'Radiology' },
  { id: 'DEV-007', name: 'Defibrillator ER-2', zone: 'ER' },
  { id: 'DEV-008', name: 'Anesthesia Machine OR-1', zone: 'OR' },
  { id: 'DEV-009', name: 'Surgical Robot OR-2', zone: 'OR' },
  { id: 'DEV-010', name: 'PACS Server DC-1', zone: 'DataCenter' },
];

const ThreatDetection: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [threats, setThreats] = useState<Threat[]>([
    {
      id: 1,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      threat_type: 'ddos',
      severity: 'critical',
      confidence: 98.5,
      device_id: 'DEV-001',
      device_name: 'Patient Monitor ICU-1',
      status: 'blocked',
      description: 'DDoS attack detected - High packet rate flood targeting medical device',
      source_ip: '192.168.100.105',
      destination_ip: '10.1.0.10',
      packets: 15420,
      bytes: 1854000
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      threat_type: 'data_exfiltration',
      severity: 'high',
      confidence: 94.2,
      device_id: 'DEV-005',
      device_name: 'MRI Scanner Lab-1',
      status: 'investigating',
      description: 'Suspicious data transfer to external IP detected',
      source_ip: '10.1.0.45',
      destination_ip: '203.0.113.50',
      packets: 8750,
      bytes: 52500000
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 900000).toISOString(),
      threat_type: 'ransomware',
      severity: 'critical',
      confidence: 96.8,
      device_id: 'DEV-003',
      device_name: 'Infusion Pump ER-1',
      status: 'blocked',
      description: 'Ransomware encryption attempt detected and blocked',
      source_ip: '192.168.100.78',
      destination_ip: '10.2.0.23',
      packets: 3200,
      bytes: 384000
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      threat_type: 'dos',
      severity: 'medium',
      confidence: 78.3,
      device_id: 'DEV-002',
      device_name: 'Ventilator ICU-2',
      status: 'resolved',
      description: 'SYN flood attack mitigated successfully',
      source_ip: '192.168.100.112',
      destination_ip: '10.1.0.8',
      packets: 5600,
      bytes: 672000
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 1500000).toISOString(),
      threat_type: 'icmp_flood',
      severity: 'high',
      confidence: 91.5,
      device_id: 'DEV-007',
      device_name: 'Defibrillator ER-2',
      status: 'blocked',
      description: 'ICMP flood attack detected - Ping of death variant',
      source_ip: '192.168.100.89',
      destination_ip: '10.2.0.15',
      packets: 25000,
      bytes: 2000000
    },
    {
      id: 6,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      threat_type: 'arp_spoofing',
      severity: 'high',
      confidence: 89.7,
      device_id: 'DEV-004',
      device_name: 'ECG Monitor Ward-1',
      status: 'investigating',
      description: 'ARP spoofing attempt - Man-in-the-middle attack',
      source_ip: '192.168.100.45',
      destination_ip: '10.3.0.10',
      packets: 1200,
      bytes: 96000
    },
    {
      id: 7,
      timestamp: new Date(Date.now() - 2100000).toISOString(),
      threat_type: 'mqtt_attack',
      severity: 'critical',
      confidence: 95.2,
      device_id: 'DEV-010',
      device_name: 'PACS Server DC-1',
      status: 'blocked',
      description: 'MQTT protocol exploitation attempt on IoT broker',
      source_ip: '192.168.100.67',
      destination_ip: '10.100.0.20',
      packets: 4500,
      bytes: 540000
    },
    {
      id: 8,
      timestamp: new Date(Date.now() - 2400000).toISOString(),
      threat_type: 'reconnaissance',
      severity: 'medium',
      confidence: 82.4,
      device_id: 'DEV-008',
      device_name: 'Anesthesia Machine OR-1',
      status: 'resolved',
      description: 'Network scanning and port enumeration detected',
      source_ip: '192.168.100.33',
      destination_ip: '10.4.0.10',
      packets: 890,
      bytes: 71200
    },
  ]);

  const [filter, setFilter] = useState({
    type: 'all',
    severity: 'all',
    status: 'all',
    search: ''
  });

  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection for real-time threats
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:8000/ws');
        wsRef.current = ws;
        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => {
          setIsConnected(false);
          setTimeout(connectWebSocket, 3000);
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.attack_type && data.attack_type !== 'Benign') {
              const newThreat: Threat = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                threat_type: data.attack_type.toLowerCase().replace(' ', '_'),
                severity: data.confidence > 90 ? 'critical' : data.confidence > 70 ? 'high' : 'medium',
                confidence: data.confidence || 85,
                device_id: `DEV-${String(Math.floor(Math.random() * 85) + 1).padStart(3, '0')}`,
                device_name: SAMPLE_DEVICES[Math.floor(Math.random() * SAMPLE_DEVICES.length)].name,
                status: 'active',
                description: `${data.attack_type} attack detected from network traffic analysis`,
                source_ip: data.source_ip || `192.168.100.${Math.floor(Math.random() * 254) + 1}`,
                destination_ip: data.dest_ip || `10.${Math.floor(Math.random() * 4) + 1}.0.${Math.floor(Math.random() * 254) + 1}`,
                packets: Math.floor(Math.random() * 10000) + 1000,
                bytes: Math.floor(Math.random() * 1000000) + 100000
              };
              setThreats(prev => [newThreat, ...prev].slice(0, 50));
            }
          } catch (e) { /* ignore */ }
        };
      } catch (e) {
        setTimeout(connectWebSocket, 3000);
      }
    };
    connectWebSocket();
    return () => wsRef.current?.close();
  }, []);

  const getAttackInfo = (type: string) => {
    return ALL_ATTACK_TYPES.find(a => a.key === type) || { key: type, name: type, color: '#666', icon: '⚠️', bg: 'bg-gray-500' };
  };

  const safeUpperCase = (str: string | undefined | null): string => {
    const attackInfo = ALL_ATTACK_TYPES.find(a => a.key === str);
    if (attackInfo) return attackInfo.name;
    return (str || 'unknown').toUpperCase().replace('_', ' ');
  };

  const filteredThreats = threats.filter(threat => {
    if (filter.type !== 'all' && threat.threat_type !== filter.type) return false;
    if (filter.severity !== 'all' && threat.severity !== filter.severity) return false;
    if (filter.status !== 'all' && threat.status !== filter.status) return false;
    if (filter.search && !threat.device_name.toLowerCase().includes(filter.search.toLowerCase()) &&
        !threat.description.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: threats.length,
    critical: threats.filter(t => t.severity === 'critical').length,
    active: threats.filter(t => t.status === 'investigating' || t.status === 'active').length,
    blocked: threats.filter(t => t.status === 'blocked').length,
  };

  const handleBlock = (id: number) => {
    setThreats(prev => prev.map(t => t.id === id ? { ...t, status: 'blocked' } : t));
  };

  const handleResolve = (id: number) => {
    setThreats(prev => prev.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
  };

  const handleDelete = (id: number) => {
    setThreats(prev => prev.filter(t => t.id !== id));
    setSelectedThreat(null);
  };

  // Theme-aware colors
  const bgMain = isDark ? 'bg-[#0a0f1c]' : 'bg-gray-100';
  const bgCard = isDark ? 'bg-gradient-to-br from-[#0d1424] to-[#1a1f2e]' : 'bg-white';
  const bgInput = isDark ? 'bg-[#0a0f1c]' : 'bg-gray-50';
  const borderColor = isDark ? 'border-gray-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${bgMain} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${textPrimary} mb-1`}>Threat Detection</h1>
          <p className={textSecondary}>Monitor and analyze security threats in real-time</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${isConnected ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`text-xs font-medium ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`${bgCard} ${textPrimary} px-4 py-2 rounded-lg border ${borderColor} focus:outline-none focus:border-blue-500`}
          >
            <option value="1h">Last 1 Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${bgCard} rounded-2xl p-6 border ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={textSecondary + " text-sm"}>Total Threats</p>
              <p className={`text-3xl font-bold ${textPrimary} mt-1`}>{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className={`${bgCard} rounded-2xl p-6 border ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={textSecondary + " text-sm"}>Critical</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{stats.critical}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚨</span>
            </div>
          </div>
        </div>

        <div className={`${bgCard} rounded-2xl p-6 border ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={textSecondary + " text-sm"}>Active</p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className={`${bgCard} rounded-2xl p-6 border ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={textSecondary + " text-sm"}>Blocked</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.blocked}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🛡️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${bgCard} rounded-2xl p-6 border ${borderColor} mb-6`}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search threats..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className={`w-full ${bgInput} ${textPrimary} pl-10 pr-4 py-2 rounded-lg border ${borderColor} focus:outline-none focus:border-blue-500`}
              />
            </div>
          </div>

          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className={`${bgInput} ${textPrimary} px-4 py-2 rounded-lg border ${borderColor} focus:outline-none focus:border-blue-500`}
          >
            <option value="all">All Types</option>
            {ALL_ATTACK_TYPES.map(attack => (
              <option key={attack.key} value={attack.key}>{attack.icon} {attack.name}</option>
            ))}
          </select>

          <select
            value={filter.severity}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
            className={`${bgInput} ${textPrimary} px-4 py-2 rounded-lg border ${borderColor} focus:outline-none focus:border-blue-500`}
          >
            <option value="all">All Severities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className={`${bgInput} ${textPrimary} px-4 py-2 rounded-lg border ${borderColor} focus:outline-none focus:border-blue-500`}
          >
            <option value="all">All Status</option>
            <option value="active">🔴 Active</option>
            <option value="investigating">🔍 Investigating</option>
            <option value="blocked">🛡️ Blocked</option>
            <option value="resolved">✅ Resolved</option>
          </select>

          <button
            onClick={() => setFilter({ type: 'all', severity: 'all', status: 'all', search: '' })}
            className={`px-4 py-2 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary} rounded-lg transition-colors`}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threats List */}
        <div className={`lg:col-span-2 ${bgCard} rounded-2xl border ${borderColor} overflow-hidden`}>
          <div className={`p-6 border-b ${borderColor}`}>
            <h2 className={`text-lg font-semibold ${textPrimary}`}>Threat Log</h2>
            <p className={`${textMuted} text-sm`}>{filteredThreats.length} threats found</p>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {filteredThreats.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-6xl mb-4 block">✅</span>
                <p className={textSecondary}>No threats match your filters</p>
              </div>
            ) : (
              <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                {filteredThreats.map((threat) => {
                  const attackInfo = getAttackInfo(threat.threat_type);
                  return (
                    <div
                      key={threat.id}
                      onClick={() => setSelectedThreat(threat)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedThreat?.id === threat.id 
                          ? (isDark ? 'bg-white/10' : 'bg-blue-50') 
                          : (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50')
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                            style={{ backgroundColor: `${attackInfo.color}20` }}
                          >
                            {attackInfo.icon}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap">
                              <h3 className={`${textPrimary} font-medium`}>{attackInfo.name}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                threat.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                threat.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                threat.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {threat.severity.toUpperCase()}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                threat.status === 'blocked' ? 'bg-emerald-500/20 text-emerald-400' :
                                threat.status === 'resolved' ? 'bg-gray-500/20 text-gray-400' :
                                threat.status === 'investigating' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {threat.status.toUpperCase()}
                              </span>
                            </div>
                            <p className={`${textSecondary} text-sm mt-1`}>{threat.device_name}</p>
                            <p className={`${textMuted} text-xs mt-1`}>
                              {new Date(threat.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`${textPrimary} font-medium`}>{threat.confidence.toFixed(1)}%</p>
                          <p className={`${textMuted} text-xs`}>Confidence</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Threat Details Panel */}
        <div className={`${bgCard} rounded-2xl border ${borderColor} overflow-hidden`}>
          <div className={`p-6 border-b ${borderColor}`}>
            <h2 className={`text-lg font-semibold ${textPrimary}`}>Threat Details</h2>
          </div>

          {selectedThreat ? (
            <div className="p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${getAttackInfo(selectedThreat.threat_type).color}20` }}
                  >
                    {getAttackInfo(selectedThreat.threat_type).icon}
                  </div>
                  <div>
                    <h3 className={`${textPrimary} font-semibold text-lg`}>{getAttackInfo(selectedThreat.threat_type).name}</h3>
                    <p className={`${textSecondary} text-sm`}>ID: #{selectedThreat.id}</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`${bgInput} rounded-lg p-3`}>
                    <p className={`${textMuted} text-xs`}>Severity</p>
                    <p className={`font-medium ${
                      selectedThreat.severity === 'critical' ? 'text-red-400' :
                      selectedThreat.severity === 'high' ? 'text-orange-400' :
                      selectedThreat.severity === 'medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>{selectedThreat.severity.toUpperCase()}</p>
                  </div>
                  <div className={`${bgInput} rounded-lg p-3`}>
                    <p className={`${textMuted} text-xs`}>Confidence</p>
                    <p className={`${textPrimary} font-medium`}>{selectedThreat.confidence.toFixed(1)}%</p>
                  </div>
                  <div className={`${bgInput} rounded-lg p-3`}>
                    <p className={`${textMuted} text-xs`}>Status</p>
                    <p className={`font-medium ${
                      selectedThreat.status === 'blocked' ? 'text-emerald-400' :
                      selectedThreat.status === 'resolved' ? 'text-gray-400' :
                      'text-yellow-400'
                    }`}>{selectedThreat.status.toUpperCase()}</p>
                  </div>
                  <div className={`${bgInput} rounded-lg p-3`}>
                    <p className={`${textMuted} text-xs`}>Packets</p>
                    <p className={`${textPrimary} font-medium`}>{selectedThreat.packets?.toLocaleString() || 'N/A'}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className={`${bgInput} rounded-lg p-3`}>
                    <p className={`${textMuted} text-xs mb-1`}>Description</p>
                    <p className={`${textPrimary} text-sm`}>{selectedThreat.description}</p>
                  </div>
                  <div className={`${bgInput} rounded-lg p-3`}>
                    <p className={`${textMuted} text-xs mb-1`}>Target Device</p>
                    <p className={`${textPrimary} text-sm`}>{selectedThreat.device_name}</p>
                    <p className={`${textSecondary} text-xs`}>{selectedThreat.device_id}</p>
                  </div>
                  <div className={`${bgInput} rounded-lg p-3`}>
                    <p className={`${textMuted} text-xs mb-1`}>Source IP</p>
                    <p className={`${textPrimary} text-sm font-mono`}>{selectedThreat.source_ip || 'Unknown'}</p>
                  </div>
                  <div className={`${bgInput} rounded-lg p-3`}>
                    <p className={`${textMuted} text-xs mb-1`}>Destination IP</p>
                    <p className={`${textPrimary} text-sm font-mono`}>{selectedThreat.destination_ip || 'Unknown'}</p>
                  </div>
                  <div className={`${bgInput} rounded-lg p-3`}>
                    <p className={`${textMuted} text-xs mb-1`}>Data Transfer</p>
                    <p className={`${textPrimary} text-sm`}>{((selectedThreat.bytes || 0) / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div className={`${bgInput} rounded-lg p-3`}>
                    <p className={`${textMuted} text-xs mb-1`}>Detected At</p>
                    <p className={`${textPrimary} text-sm`}>{new Date(selectedThreat.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  {selectedThreat.status !== 'blocked' && selectedThreat.status !== 'resolved' && (
                    <button
                      onClick={() => handleBlock(selectedThreat.id)}
                      className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      🛡️ Block
                    </button>
                  )}
                  {selectedThreat.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(selectedThreat.id)}
                      className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                    >
                      ✅ Resolve
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedThreat.id)}
                    className={`px-4 py-2 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary} rounded-lg transition-colors`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">ℹ️</span>
              <p className={textSecondary}>Select a threat to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreatDetection;
