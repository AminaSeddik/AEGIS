import React, { useState, useEffect, useRef } from 'react';
import StatusLED from '../StatusLED/StatusLED';
import { useTheme } from '../../ThemeContext';

interface Device {
  id: string;
  name: string;
  type: string;
  location: string;
  ip_address: string;
  mac_address: string;
  status: 'online' | 'offline' | 'warning' | 'critical';
  last_seen: string;
  firmware: string;
  manufacturer: string;
  model: string;
  threats_detected: number;
  data_transferred: string;
  zone: string;
}

const generateMAC = (idx: number) => {
  const hex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `AA:BB:CC:${hex(Math.floor(idx/256))}:${hex(idx%256)}:${hex((idx*7)%256)}`;
};

// All 85 Hospital Devices
const HOSPITAL_DEVICES: Device[] = [
  // Core Infrastructure (10)
  { id: 'CORE-001', name: 'Main Firewall', type: 'Firewall', location: 'Core', ip_address: '10.0.0.1', mac_address: generateMAC(1), status: 'online', last_seen: new Date().toISOString(), firmware: 'v7.2.1', manufacturer: 'Palo Alto', model: 'PA-3260', threats_detected: 0, data_transferred: '1.2 TB', zone: 'Core' },
  { id: 'CORE-002', name: 'Core Router', type: 'Router', location: 'Core', ip_address: '10.0.0.2', mac_address: generateMAC(2), status: 'online', last_seen: new Date().toISOString(), firmware: 'v16.9.4', manufacturer: 'Cisco', model: 'ISR 4451', threats_detected: 0, data_transferred: '856 GB', zone: 'Core' },
  { id: 'CORE-003', name: 'IDS/IPS AEGIS', type: 'Security', location: 'Security Zone', ip_address: '10.0.0.5', mac_address: generateMAC(3), status: 'online', last_seen: new Date().toISOString(), firmware: 'v2.3.0', manufacturer: 'AEGIS', model: 'Guardian-X', threats_detected: 0, data_transferred: '234 GB', zone: 'Security' },
  { id: 'CORE-004', name: 'SIEM Server', type: 'Server', location: 'Security Zone', ip_address: '10.0.0.7', mac_address: generateMAC(4), status: 'online', last_seen: new Date().toISOString(), firmware: 'v8.1.2', manufacturer: 'Splunk', model: 'Enterprise', threats_detected: 0, data_transferred: '567 GB', zone: 'Security' },
  { id: 'CORE-005', name: 'Distribution Switch 1', type: 'Switch', location: 'Core', ip_address: '10.0.0.10', mac_address: generateMAC(5), status: 'online', last_seen: new Date().toISOString(), firmware: 'v15.2.7', manufacturer: 'Cisco', model: 'Catalyst 9300', threats_detected: 0, data_transferred: '2.1 TB', zone: 'Core' },
  { id: 'CORE-006', name: 'Distribution Switch 2', type: 'Switch', location: 'Core', ip_address: '10.0.0.11', mac_address: generateMAC(6), status: 'online', last_seen: new Date().toISOString(), firmware: 'v15.2.7', manufacturer: 'Cisco', model: 'Catalyst 9300', threats_detected: 0, data_transferred: '1.8 TB', zone: 'Core' },
  // ICU Department (25 devices)
  { id: 'ICU-SW', name: 'ICU Switch', type: 'Switch', location: 'ICU', ip_address: '10.1.0.1', mac_address: generateMAC(10), status: 'online', last_seen: new Date().toISOString(), firmware: 'v15.2.7', manufacturer: 'Cisco', model: 'Catalyst 9200', threats_detected: 0, data_transferred: '456 GB', zone: 'ICU' },
  { id: 'ICU-AP', name: 'ICU WiFi AP', type: 'WiFi AP', location: 'ICU', ip_address: '10.1.0.2', mac_address: generateMAC(11), status: 'online', last_seen: new Date().toISOString(), firmware: 'v8.10.151', manufacturer: 'Cisco', model: 'Aironet 2800', threats_detected: 0, data_transferred: '234 GB', zone: 'ICU' },
  ...Array.from({length: 5}, (_, i) => ({ id: `ICU-V${i+1}`, name: `Ventilator ${i+1}`, type: 'Ventilator', location: 'ICU', ip_address: `10.1.0.${10+i}`, mac_address: generateMAC(20+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v1.8.2', manufacturer: 'Medtronic', model: 'PB980', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*500)+100} MB`, zone: 'ICU' })),
  ...Array.from({length: 5}, (_, i) => ({ id: `ICU-E${i+1}`, name: `ECG Monitor ${i+1}`, type: 'ECG Monitor', location: 'ICU', ip_address: `10.1.0.${15+i}`, mac_address: generateMAC(25+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v2.4.1', manufacturer: 'Philips', model: 'IntelliVue', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*300)+50} MB`, zone: 'ICU' })),
  ...Array.from({length: 8}, (_, i) => ({ id: `ICU-P${i+1}`, name: `Infusion Pump ${i+1}`, type: 'Infusion Pump', location: 'ICU', ip_address: `10.1.0.${20+i}`, mac_address: generateMAC(30+i), status: (i === 3 ? 'warning' : 'online') as any, last_seen: new Date(Date.now() - (i === 3 ? 300000 : 0)).toISOString(), firmware: 'v3.1.0', manufacturer: 'Baxter', model: 'Sigma Spectrum', threats_detected: i === 3 ? 1 : 0, data_transferred: `${Math.floor(Math.random()*200)+50} MB`, zone: 'ICU' })),
  ...Array.from({length: 5}, (_, i) => ({ id: `ICU-PM${i+1}`, name: `Patient Monitor ${i+1}`, type: 'Patient Monitor', location: 'ICU', ip_address: `10.1.0.${30+i}`, mac_address: generateMAC(40+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v2.4.1', manufacturer: 'Philips', model: 'IntelliVue MX800', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*800)+200} MB`, zone: 'ICU' })),
  // ER Department (20 devices)
  { id: 'ER-SW', name: 'ER Switch', type: 'Switch', location: 'Emergency Room', ip_address: '10.2.0.1', mac_address: generateMAC(50), status: 'online', last_seen: new Date().toISOString(), firmware: 'v15.2.7', manufacturer: 'Cisco', model: 'Catalyst 9200', threats_detected: 0, data_transferred: '389 GB', zone: 'ER' },
  { id: 'ER-AP', name: 'ER WiFi AP', type: 'WiFi AP', location: 'Emergency Room', ip_address: '10.2.0.2', mac_address: generateMAC(51), status: 'online', last_seen: new Date().toISOString(), firmware: 'v8.10.151', manufacturer: 'Cisco', model: 'Aironet 2800', threats_detected: 0, data_transferred: '198 GB', zone: 'ER' },
  ...Array.from({length: 4}, (_, i) => ({ id: `ER-D${i+1}`, name: `Defibrillator ${i+1}`, type: 'Defibrillator', location: 'Emergency Room', ip_address: `10.2.0.${10+i}`, mac_address: generateMAC(52+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v3.5.2', manufacturer: 'Zoll', model: 'R Series', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*100)+50} MB`, zone: 'ER' })),
  ...Array.from({length: 4}, (_, i) => ({ id: `ER-E${i+1}`, name: `ECG ER ${i+1}`, type: 'ECG Monitor', location: 'Emergency Room', ip_address: `10.2.0.${14+i}`, mac_address: generateMAC(56+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v2.1.0', manufacturer: 'Philips', model: 'PageWriter TC70', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*150)+50} MB`, zone: 'ER' })),
  ...Array.from({length: 6}, (_, i) => ({ id: `ER-V${i+1}`, name: `Vital Signs ${i+1}`, type: 'Vital Signs Monitor', location: 'Emergency Room', ip_address: `10.2.0.${18+i}`, mac_address: generateMAC(60+i), status: (i === 5 ? 'critical' : 'online') as any, last_seen: new Date(Date.now() - (i === 5 ? 600000 : 0)).toISOString(), firmware: 'v4.2.1', manufacturer: 'GE Healthcare', model: 'Carescape B650', threats_detected: i === 5 ? 3 : 0, data_transferred: `${Math.floor(Math.random()*200)+100} MB`, zone: 'ER' })),
  ...Array.from({length: 4}, (_, i) => ({ id: `ER-X${i+1}`, name: `Portable X-Ray ${i+1}`, type: 'X-Ray', location: 'Emergency Room', ip_address: `10.2.0.${26+i}`, mac_address: generateMAC(68+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v5.1.3', manufacturer: 'GE Healthcare', model: 'Optima XR220', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*5)+1} GB`, zone: 'ER' })),
  // Ward (20 devices)
  { id: 'WARD-SW', name: 'Ward Switch', type: 'Switch', location: 'General Ward', ip_address: '10.3.0.1', mac_address: generateMAC(80), status: 'online', last_seen: new Date().toISOString(), firmware: 'v15.2.7', manufacturer: 'Cisco', model: 'Catalyst 9200', threats_detected: 0, data_transferred: '278 GB', zone: 'Ward' },
  { id: 'WARD-AP', name: 'Ward WiFi AP', type: 'WiFi AP', location: 'General Ward', ip_address: '10.3.0.2', mac_address: generateMAC(81), status: 'online', last_seen: new Date().toISOString(), firmware: 'v8.10.151', manufacturer: 'Cisco', model: 'Aironet 2800', threats_detected: 0, data_transferred: '156 GB', zone: 'Ward' },
  ...Array.from({length: 6}, (_, i) => ({ id: `WARD-PM${i+1}`, name: `Patient Monitor W${i+1}`, type: 'Patient Monitor', location: 'General Ward', ip_address: `10.3.0.${10+i}`, mac_address: generateMAC(82+i), status: (i === 2 ? 'offline' : 'online') as any, last_seen: new Date(Date.now() - (i === 2 ? 3600000 : 0)).toISOString(), firmware: 'v2.4.1', manufacturer: 'Philips', model: 'IntelliVue MX40', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*300)+100} MB`, zone: 'Ward' })),
  ...Array.from({length: 4}, (_, i) => ({ id: `WARD-T${i+1}`, name: `Temp Sensor ${i+1}`, type: 'Temperature Sensor', location: 'General Ward', ip_address: `10.3.0.${18+i}`, mac_address: generateMAC(90+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v1.2.0', manufacturer: 'Sensirion', model: 'STS40', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*50)+10} MB`, zone: 'Ward' })),
  ...Array.from({length: 4}, (_, i) => ({ id: `WARD-H${i+1}`, name: `Heart Rate ${i+1}`, type: 'Heart Rate Monitor', location: 'General Ward', ip_address: `10.3.0.${22+i}`, mac_address: generateMAC(94+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v2.0.1', manufacturer: 'Masimo', model: 'Rad-97', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*100)+50} MB`, zone: 'Ward' })),
  ...Array.from({length: 4}, (_, i) => ({ id: `WARD-NS${i+1}`, name: `Nurse Station ${i+1}`, type: 'Nurse Station', location: 'General Ward', ip_address: `10.3.0.${26+i}`, mac_address: generateMAC(98+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v3.1.0', manufacturer: 'Cerner', model: 'CareAware', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*500)+200} MB`, zone: 'Ward' })),
  // Operating Room (10 devices)
  { id: 'OR-SW', name: 'OR Switch', type: 'Switch', location: 'Operating Room', ip_address: '10.4.0.1', mac_address: generateMAC(110), status: 'online', last_seen: new Date().toISOString(), firmware: 'v15.2.7', manufacturer: 'Cisco', model: 'Catalyst 9200', threats_detected: 0, data_transferred: '189 GB', zone: 'OR' },
  { id: 'OR-AP', name: 'OR WiFi AP', type: 'WiFi AP', location: 'Operating Room', ip_address: '10.4.0.2', mac_address: generateMAC(111), status: 'online', last_seen: new Date().toISOString(), firmware: 'v8.10.151', manufacturer: 'Cisco', model: 'Aironet 2800', threats_detected: 0, data_transferred: '98 GB', zone: 'OR' },
  ...Array.from({length: 3}, (_, i) => ({ id: `OR-A${i+1}`, name: `Anesthesia ${i+1}`, type: 'Anesthesia Machine', location: 'Operating Room', ip_address: `10.4.0.${10+i}`, mac_address: generateMAC(112+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v6.2.1', manufacturer: 'Dräger', model: 'Perseus A500', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*300)+100} MB`, zone: 'OR' })),
  ...Array.from({length: 4}, (_, i) => ({ id: `OR-S${i+1}`, name: `Surgical Equip ${i+1}`, type: 'Surgical Equipment', location: 'Operating Room', ip_address: `10.4.0.${13+i}`, mac_address: generateMAC(115+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v4.5.2', manufacturer: 'Intuitive', model: 'da Vinci Xi', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*2)+1} GB`, zone: 'OR' })),
  ...Array.from({length: 3}, (_, i) => ({ id: `OR-I${i+1}`, name: `Imaging Sys ${i+1}`, type: 'Imaging System', location: 'Operating Room', ip_address: `10.4.0.${17+i}`, mac_address: generateMAC(119+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v3.8.1', manufacturer: 'Siemens', model: 'Cios Spin', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*10)+5} GB`, zone: 'OR' })),
  // Data Center (10 servers)
  { id: 'DC-SW', name: 'DC Switch', type: 'Switch', location: 'Data Center', ip_address: '10.100.0.1', mac_address: generateMAC(130), status: 'online', last_seen: new Date().toISOString(), firmware: 'v15.2.7', manufacturer: 'Cisco', model: 'Nexus 9300', threats_detected: 0, data_transferred: '4.5 TB', zone: 'DataCenter' },
  { id: 'DC-EMR', name: 'EMR Server', type: 'Server', location: 'Data Center', ip_address: '10.100.0.10', mac_address: generateMAC(131), status: 'online', last_seen: new Date().toISOString(), firmware: 'v2023.2', manufacturer: 'Dell', model: 'PowerEdge R750', threats_detected: 0, data_transferred: '2.3 TB', zone: 'DataCenter' },
  { id: 'DC-PACS', name: 'PACS Server', type: 'Server', location: 'Data Center', ip_address: '10.100.0.11', mac_address: generateMAC(132), status: 'online', last_seen: new Date().toISOString(), firmware: 'v2023.1', manufacturer: 'Dell', model: 'PowerEdge R750', threats_detected: 0, data_transferred: '8.7 TB', zone: 'DataCenter' },
  { id: 'DC-DB', name: 'Database Server', type: 'Server', location: 'Data Center', ip_address: '10.100.0.12', mac_address: generateMAC(133), status: 'online', last_seen: new Date().toISOString(), firmware: 'v2023.2', manufacturer: 'Dell', model: 'PowerEdge R750', threats_detected: 0, data_transferred: '1.8 TB', zone: 'DataCenter' },
  { id: 'DC-MQTT', name: 'MQTT Broker', type: 'Server', location: 'Data Center', ip_address: '10.100.0.20', mac_address: generateMAC(134), status: 'online', last_seen: new Date().toISOString(), firmware: 'v2.0.15', manufacturer: 'Dell', model: 'PowerEdge R640', threats_detected: 0, data_transferred: '567 GB', zone: 'DataCenter' },
  ...Array.from({length: 5}, (_, i) => ({ id: `DC-APP${i+1}`, name: `App Server ${i+1}`, type: 'Server', location: 'Data Center', ip_address: `10.100.0.${21+i}`, mac_address: generateMAC(135+i), status: 'online' as const, last_seen: new Date().toISOString(), firmware: 'v2023.2', manufacturer: 'Dell', model: 'PowerEdge R640', threats_detected: 0, data_transferred: `${Math.floor(Math.random()*500)+200} GB`, zone: 'DataCenter' })),
];

const DeviceManagement: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [devices, setDevices] = useState<Device[]>(HOSPITAL_DEVICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'threats' | 'zone'>('name');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection
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
              // Update a random device with threat
              setDevices(prev => {
                const idx = Math.floor(Math.random() * prev.length);
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  threats_detected: updated[idx].threats_detected + 1,
                  status: updated[idx].threats_detected >= 2 ? 'critical' : 'warning'
                };
                return updated;
              });
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

  const deviceTypes = Array.from(new Set(devices.map(d => d.type))).sort();
  const zones = Array.from(new Set(devices.map(d => d.zone))).sort();

  const filteredDevices = devices
    .filter(device => {
      if (filterType !== 'all' && device.type !== filterType) return false;
      if (filterStatus !== 'all' && device.status !== filterStatus) return false;
      if (filterZone !== 'all' && device.zone !== filterZone) return false;
      if (searchTerm && !device.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !device.ip_address.includes(searchTerm) &&
          !device.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'zone') return a.zone.localeCompare(b.zone);
      if (sortBy === 'status') {
        const order = { critical: 0, warning: 1, offline: 2, online: 3 };
        return order[a.status] - order[b.status];
      }
      if (sortBy === 'threats') return b.threats_detected - a.threats_detected;
      return 0;
    });

  const stats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    warning: devices.filter(d => d.status === 'warning' || d.status === 'critical').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'offline': return 'bg-gray-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500/20 text-emerald-400';
      case 'offline': return 'bg-gray-500/20 text-gray-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      case 'critical': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getDeviceIcon = (type: string) => {
    if (type.includes('Monitor') || type.includes('ECG')) return '📟';
    if (type.includes('Ventilator')) return '🫁';
    if (type.includes('Pump')) return '💉';
    if (type.includes('Scanner') || type.includes('X-Ray') || type.includes('Imaging')) return '🔬';
    if (type.includes('Defibrillator')) return '⚡';
    if (type.includes('Server')) return '🖥️';
    if (type.includes('Switch')) return '🔌';
    if (type.includes('Router')) return '🔀';
    if (type.includes('Firewall')) return '🛡️';
    if (type.includes('WiFi')) return '📶';
    if (type.includes('Anesthesia')) return '💨';
    if (type.includes('Surgical')) return '🔪';
    if (type.includes('Nurse')) return '👩‍⚕️';
    if (type.includes('Security')) return '🔍';
    return '📱';
  };

  // Theme colors
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
          <h1 className={`text-3xl font-bold ${textPrimary} mb-1`}>Device Management</h1>
          <p className={textSecondary}>Monitor and manage all {devices.length} connected medical IoT devices</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg ${isConnected ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`text-xs font-medium ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Device</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`${bgCard} rounded-2xl p-6 border ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${textSecondary} text-sm`}>Total Devices</p>
              <p className={`text-3xl font-bold ${textPrimary} mt-1`}>{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl">📱</div>
          </div>
        </div>
        <div className={`${bgCard} rounded-2xl p-6 border ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${textSecondary} text-sm`}>Online</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.online}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-2xl">✅</div>
          </div>
        </div>
        <div className={`${bgCard} rounded-2xl p-6 border ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${textSecondary} text-sm`}>Offline</p>
              <p className="text-3xl font-bold text-gray-400 mt-1">{stats.offline}</p>
            </div>
            <div className="w-12 h-12 bg-gray-500/20 rounded-xl flex items-center justify-center text-2xl">⭕</div>
          </div>
        </div>
        <div className={`${bgCard} rounded-2xl p-6 border ${borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${textSecondary} text-sm`}>Alerts</p>
              <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.warning}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-2xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${bgCard} rounded-2xl p-6 border ${borderColor} mb-6`}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">🔍</span>
              <input
                type="text"
                placeholder="Search devices by name, IP, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${bgInput} ${textPrimary} pl-10 pr-4 py-2 rounded-lg border ${borderColor} focus:outline-none focus:border-blue-500`}
              />
            </div>
          </div>
          <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)}
            className={`${bgInput} ${textPrimary} px-4 py-2 rounded-lg border ${borderColor} focus:outline-none focus:border-blue-500`}>
            <option value="all">All Zones</option>
            {zones.map(zone => <option key={zone} value={zone}>{zone}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className={`${bgInput} ${textPrimary} px-4 py-2 rounded-lg border ${borderColor} focus:outline-none focus:border-blue-500`}>
            <option value="all">All Types</option>
            {deviceTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className={`${bgInput} ${textPrimary} px-4 py-2 rounded-lg border ${borderColor} focus:outline-none focus:border-blue-500`}>
            <option value="all">All Status</option>
            <option value="online">🟢 Online</option>
            <option value="offline">⚫ Offline</option>
            <option value="warning">🟡 Warning</option>
            <option value="critical">🔴 Critical</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className={`${bgInput} ${textPrimary} px-4 py-2 rounded-lg border ${borderColor} focus:outline-none focus:border-blue-500`}>
            <option value="name">Sort by Name</option>
            <option value="zone">Sort by Zone</option>
            <option value="status">Sort by Status</option>
            <option value="threats">Sort by Threats</option>
          </select>
        </div>
      </div>

      {/* Device Count */}
      <p className={`${textMuted} mb-4`}>Showing {filteredDevices.length} of {devices.length} devices</p>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDevices.map((device) => (
          <div key={device.id} onClick={() => setSelectedDevice(device)}
            className={`${bgCard} rounded-xl p-4 border ${borderColor} hover:border-blue-500 cursor-pointer transition-all hover:transform hover:scale-[1.02]`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-xl">
                {getDeviceIcon(device.type)}
              </div>
              <div className="flex items-center space-x-2">
                {device.threats_detected > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                    THREAT {device.threats_detected}
                  </span>
                ) : (
                  <StatusLED
                    status={device.status === 'warning' || device.status === 'critical' ? 'warning' : 'healthy'}
                    size="md"
                    label={device.status.toUpperCase()}
                  />
                )}
              </div>
            </div>
            <h3 className={`${textPrimary} font-semibold mb-1 truncate text-sm`}>{device.name}</h3>
            <p className={`${textSecondary} text-xs mb-2`}>{device.type}</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className={textMuted}>IP</span>
                <span className={`${textSecondary} font-mono`}>{device.ip_address}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={textMuted}>Zone</span>
                <span className={textSecondary}>{device.zone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={textMuted}>Threats</span>
                <span className={device.threats_detected > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {device.threats_detected}
                </span>
              </div>
            </div>
            {device.threats_detected > 0 && (
              <div className="mt-3 px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-xs flex items-center">⚠️ {device.threats_detected} threat(s)</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDevice(null)}>
          <div className={`${isDark ? 'bg-[#0d1424]' : 'bg-white'} rounded-2xl border ${borderColor} w-full max-w-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
            <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Device Details</h2>
              <button onClick={() => setSelectedDevice(null)} className={textSecondary}>✕</button>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center text-3xl">
                  {getDeviceIcon(selectedDevice.type)}
                </div>
                <div>
                  <h3 className={`${textPrimary} text-xl font-semibold`}>{selectedDevice.name}</h3>
                  <p className={textSecondary}>{selectedDevice.type}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${getStatusBgColor(selectedDevice.status)}`}>
                    {selectedDevice.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Device ID', value: selectedDevice.id },
                  { label: 'IP Address', value: selectedDevice.ip_address, mono: true },
                  { label: 'MAC Address', value: selectedDevice.mac_address, mono: true },
                  { label: 'Zone', value: selectedDevice.zone },
                  { label: 'Location', value: selectedDevice.location },
                  { label: 'Manufacturer', value: selectedDevice.manufacturer },
                  { label: 'Model', value: selectedDevice.model },
                  { label: 'Firmware', value: selectedDevice.firmware },
                  { label: 'Last Seen', value: new Date(selectedDevice.last_seen).toLocaleString() },
                  { label: 'Data Transferred', value: selectedDevice.data_transferred },
                ].map(item => (
                  <div key={item.label} className={`${bgInput} rounded-lg p-4`}>
                    <p className={`${textMuted} text-sm`}>{item.label}</p>
                    <p className={`${textPrimary} ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                  </div>
                ))}
                <div className={`${bgInput} rounded-lg p-4 col-span-2`}>
                  <p className={`${textMuted} text-sm`}>Threats Detected</p>
                  <p className={selectedDevice.threats_detected > 0 ? 'text-red-400 text-2xl font-bold' : 'text-emerald-400 text-2xl'}>
                    {selectedDevice.threats_detected}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">📝 Edit</button>
                <button className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg">🔄 Restart</button>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className={`${isDark ? 'bg-[#0d1424]' : 'bg-white'} rounded-2xl border ${borderColor} w-full max-w-lg`} onClick={e => e.stopPropagation()}>
            <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
              <h2 className={`text-xl font-semibold ${textPrimary}`}>Add New Device</h2>
              <button onClick={() => setShowAddModal(false)} className={textSecondary}>✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block ${textSecondary} text-sm mb-2`}>Device Name</label>
                <input type="text" placeholder="Enter device name" className={`w-full ${bgInput} ${textPrimary} px-4 py-2 rounded-lg border ${borderColor}`} />
              </div>
              <div>
                <label className={`block ${textSecondary} text-sm mb-2`}>Device Type</label>
                <select className={`w-full ${bgInput} ${textPrimary} px-4 py-2 rounded-lg border ${borderColor}`}>
                  {deviceTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className={`block ${textSecondary} text-sm mb-2`}>Zone</label>
                <select className={`w-full ${bgInput} ${textPrimary} px-4 py-2 rounded-lg border ${borderColor}`}>
                  {zones.map(zone => <option key={zone} value={zone}>{zone}</option>)}
                </select>
              </div>
              <div>
                <label className={`block ${textSecondary} text-sm mb-2`}>IP Address</label>
                <input type="text" placeholder="10.x.x.x" className={`w-full ${bgInput} ${textPrimary} px-4 py-2 rounded-lg border ${borderColor}`} />
              </div>
              <div className="flex space-x-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className={`flex-1 px-4 py-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${textPrimary} rounded-lg`}>Cancel</button>
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Add Device</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;
