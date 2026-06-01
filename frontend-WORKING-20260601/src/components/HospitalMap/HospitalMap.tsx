import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';

type DeviceStatus = 'normal' | 'warning' | 'threat';
type Zone = 'ICU' | 'ER' | 'Ward' | 'OR';

interface BedDevice {
  bedNumber: number;
  patientId: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  status: DeviceStatus;
  threatsDetected: number;
  zone: Zone;
  lastSeen: string;
}

const HOSPITAL_BEDS: BedDevice[] = [
  { bedNumber: 1,  patientId: 'P-1138', deviceId: 'ICU-PM1', deviceName: 'Patient Monitor', deviceType: 'Monitor',     ipAddress: '10.1.0.30', status: 'normal',  threatsDetected: 0, zone: 'ICU', lastSeen: 'Just now' },
  { bedNumber: 2,  patientId: 'P-1142', deviceId: 'ICU-V1',  deviceName: 'Ventilator',      deviceType: 'Ventilator',  ipAddress: '10.1.0.10', status: 'normal',  threatsDetected: 0, zone: 'ICU', lastSeen: 'Just now' },
  { bedNumber: 3,  patientId: 'P-1156', deviceId: 'ICU-PM2', deviceName: 'Patient Monitor', deviceType: 'Monitor',     ipAddress: '10.1.0.31', status: 'normal',  threatsDetected: 0, zone: 'ICU', lastSeen: 'Just now' },
  { bedNumber: 4,  patientId: 'P-1163', deviceId: 'ICU-P4',  deviceName: 'Infusion Pump',   deviceType: 'Pump',        ipAddress: '10.1.0.23', status: 'warning', threatsDetected: 1, zone: 'ICU', lastSeen: '5m ago' },
  { bedNumber: 5,  patientId: 'P-1171', deviceId: 'ICU-V2',  deviceName: 'Ventilator',      deviceType: 'Ventilator',  ipAddress: '10.1.0.11', status: 'normal',  threatsDetected: 0, zone: 'ICU', lastSeen: 'Just now' },
  { bedNumber: 6,  patientId: 'P-1184', deviceId: 'ICU-E1',  deviceName: 'ECG Monitor',     deviceType: 'Monitor',     ipAddress: '10.1.0.15', status: 'normal',  threatsDetected: 0, zone: 'ICU', lastSeen: 'Just now' },
  { bedNumber: 7,  patientId: 'P-1192', deviceId: 'ICU-PM3', deviceName: 'Patient Monitor', deviceType: 'Monitor',     ipAddress: '10.1.0.32', status: 'normal',  threatsDetected: 0, zone: 'ICU', lastSeen: 'Just now' },
  { bedNumber: 8,  patientId: 'P-1205', deviceId: 'ICU-V3',  deviceName: 'Ventilator',      deviceType: 'Ventilator',  ipAddress: '10.1.0.12', status: 'normal',  threatsDetected: 0, zone: 'ICU', lastSeen: 'Just now' },
  { bedNumber: 9,  patientId: 'P-1219', deviceId: 'ICU-E2',  deviceName: 'ECG Monitor',     deviceType: 'Monitor',     ipAddress: '10.1.0.16', status: 'normal',  threatsDetected: 0, zone: 'ICU', lastSeen: 'Just now' },
  { bedNumber: 10, patientId: 'P-1224', deviceId: 'ICU-PM4', deviceName: 'Patient Monitor', deviceType: 'Monitor',     ipAddress: '10.1.0.33', status: 'normal',  threatsDetected: 0, zone: 'ICU', lastSeen: 'Just now' },
  { bedNumber: 1, patientId: 'P-2041', deviceId: 'ER-V1', deviceName: 'Vital Signs',   deviceType: 'Monitor',       ipAddress: '10.2.0.18', status: 'normal', threatsDetected: 0, zone: 'ER', lastSeen: 'Just now' },
  { bedNumber: 2, patientId: 'P-2055', deviceId: 'ER-D1', deviceName: 'Defibrillator', deviceType: 'Defibrillator', ipAddress: '10.2.0.10', status: 'normal', threatsDetected: 0, zone: 'ER', lastSeen: 'Just now' },
  { bedNumber: 3, patientId: 'P-2068', deviceId: 'ER-E1', deviceName: 'ECG ER',        deviceType: 'Monitor',       ipAddress: '10.2.0.14', status: 'normal', threatsDetected: 0, zone: 'ER', lastSeen: 'Just now' },
  { bedNumber: 4, patientId: 'P-2077', deviceId: 'ER-V6', deviceName: 'Vital Signs',   deviceType: 'Monitor',       ipAddress: '10.2.0.23', status: 'threat', threatsDetected: 3, zone: 'ER', lastSeen: '10m ago' },
  { bedNumber: 5, patientId: 'P-2089', deviceId: 'ER-D2', deviceName: 'Defibrillator', deviceType: 'Defibrillator', ipAddress: '10.2.0.11', status: 'normal', threatsDetected: 0, zone: 'ER', lastSeen: 'Just now' },
  { bedNumber: 6, patientId: 'P-2094', deviceId: 'ER-E2', deviceName: 'ECG ER',        deviceType: 'Monitor',       ipAddress: '10.2.0.15', status: 'normal', threatsDetected: 0, zone: 'ER', lastSeen: 'Just now' },
  { bedNumber: 1, patientId: 'P-3012', deviceId: 'OR-A1', deviceName: 'Anesthesia Machine', deviceType: 'Anesthesia', ipAddress: '10.4.0.10', status: 'normal', threatsDetected: 0, zone: 'OR', lastSeen: 'Just now' },
  { bedNumber: 2, patientId: 'P-3019', deviceId: 'OR-A2', deviceName: 'Anesthesia Machine', deviceType: 'Anesthesia', ipAddress: '10.4.0.11', status: 'normal', threatsDetected: 0, zone: 'OR', lastSeen: 'Just now' },
  { bedNumber: 3, patientId: 'P-3025', deviceId: 'OR-S1', deviceName: 'Surgical Robot',     deviceType: 'Robotic',    ipAddress: '10.4.0.20', status: 'normal', threatsDetected: 0, zone: 'OR', lastSeen: 'Just now' },
  { bedNumber: 4, patientId: 'P-3033', deviceId: 'OR-I1', deviceName: 'Imaging System',     deviceType: 'Imaging',    ipAddress: '10.4.0.30', status: 'normal', threatsDetected: 0, zone: 'OR', lastSeen: 'Just now' },
  { bedNumber: 1, patientId: 'P-4001', deviceId: 'WARD-P1', deviceName: 'Patient Monitor', deviceType: 'Monitor', ipAddress: '10.3.0.10', status: 'normal',  threatsDetected: 0, zone: 'Ward', lastSeen: 'Just now' },
  { bedNumber: 2, patientId: 'P-4012', deviceId: 'WARD-P2', deviceName: 'Patient Monitor', deviceType: 'Monitor', ipAddress: '10.3.0.11', status: 'normal',  threatsDetected: 0, zone: 'Ward', lastSeen: 'Just now' },
  { bedNumber: 3, patientId: 'P-4023', deviceId: 'WARD-P3', deviceName: 'Patient Monitor', deviceType: 'Monitor', ipAddress: '10.3.0.12', status: 'normal',  threatsDetected: 0, zone: 'Ward', lastSeen: 'Just now' },
  { bedNumber: 4, patientId: 'P-4034', deviceId: 'WARD-P4', deviceName: 'Patient Monitor', deviceType: 'Monitor', ipAddress: '10.3.0.13', status: 'normal',  threatsDetected: 0, zone: 'Ward', lastSeen: 'Just now' },
  { bedNumber: 5, patientId: 'P-4045', deviceId: 'WARD-P5', deviceName: 'Patient Monitor', deviceType: 'Monitor', ipAddress: '10.3.0.14', status: 'warning', threatsDetected: 1, zone: 'Ward', lastSeen: '15m ago' },
  { bedNumber: 6, patientId: 'P-4056', deviceId: 'WARD-P6', deviceName: 'Patient Monitor', deviceType: 'Monitor', ipAddress: '10.3.0.15', status: 'normal',  threatsDetected: 0, zone: 'Ward', lastSeen: 'Just now' },
  { bedNumber: 7, patientId: 'P-4067', deviceId: 'WARD-P7', deviceName: 'Patient Monitor', deviceType: 'Monitor', ipAddress: '10.3.0.16', status: 'normal',  threatsDetected: 0, zone: 'Ward', lastSeen: 'Just now' },
  { bedNumber: 8, patientId: 'P-4078', deviceId: 'WARD-P8', deviceName: 'Patient Monitor', deviceType: 'Monitor', ipAddress: '10.3.0.17', status: 'normal',  threatsDetected: 0, zone: 'Ward', lastSeen: 'Just now' },
];

const HospitalMap: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedBed, setSelectedBed] = useState<BedDevice | null>(null);

  const getLedColors = (status: DeviceStatus) => {
    switch (status) {
      case 'threat':
        return { dot: 'bg-red-500', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.8)]', border: 'border-red-500', pulse: 'animate-pulse', text: 'text-red-500' };
      case 'warning':
        return { dot: 'bg-amber-400', glow: 'shadow-[0_0_10px_rgba(251,191,36,0.6)]', border: 'border-amber-400', pulse: '', text: 'text-amber-500' };
      default:
        return { dot: 'bg-emerald-500', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]', border: isDark ? 'border-gray-700' : 'border-slate-200', pulse: '', text: 'text-emerald-500' };
    }
  };

  const zones: Zone[] = ['ICU', 'ER', 'OR', 'Ward'];
  const zoneCounts = zones.reduce((acc, z) => {
    const beds = HOSPITAL_BEDS.filter(b => b.zone === z);
    acc[z] = { total: beds.length, warning: beds.filter(b => b.status === 'warning').length, threat: beds.filter(b => b.status === 'threat').length };
    return acc;
  }, {} as Record<Zone, { total: number; warning: number; threat: number }>);

  const totalThreats = HOSPITAL_BEDS.filter(b => b.status === 'threat').length;
  const totalWarnings = HOSPITAL_BEDS.filter(b => b.status === 'warning').length;
  const totalHealthy = HOSPITAL_BEDS.filter(b => b.status === 'normal').length;

  const BedCard: React.FC<{ bed: BedDevice }> = ({ bed }) => {
    const colors = getLedColors(bed.status);
    const isSelected = selectedBed?.deviceId === bed.deviceId;
    return (
      <button onClick={() => setSelectedBed(bed)} className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all hover:scale-105 ${isDark ? 'bg-[#0d1424]' : 'bg-white'} ${colors.border} ${isSelected ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
        <svg className={`w-7 h-7 mb-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h18M3 12v6m0-6V8a2 2 0 012-2h4m10 6v6m0-6V8a2 2 0 00-2-2h-4m-4 0V4a1 1 0 011-1h2a1 1 0 011 1v2M7 12h2m6 0h2" />
        </svg>
        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Bed {bed.bedNumber}</span>
        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{bed.patientId}</span>
        <div className="absolute top-1.5 right-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} ${colors.glow} ${colors.pulse}`}></div>
        </div>
      </button>
    );
  };

  const renderZone = (zone: Zone, gridCols: string, bgColor: string) => {
    const beds = HOSPITAL_BEDS.filter(b => b.zone === zone);
    const zoneLabels: Record<Zone, string> = { ICU: 'Intensive Care Unit', ER: 'Emergency Room', OR: 'Operating Rooms', Ward: 'General Ward' };
    return (
      <div className={`rounded-xl border-2 border-dashed p-4 ${bgColor} ${isDark ? 'border-gray-700' : 'border-slate-300'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{zoneLabels[zone]}</h3>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>({beds.length} beds)</span>
          </div>
          <div className="flex items-center space-x-2">
            {zoneCounts[zone].threat > 0 && <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-semibold rounded animate-pulse">{zoneCounts[zone].threat} threat</span>}
            {zoneCounts[zone].warning > 0 && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs font-semibold rounded">{zoneCounts[zone].warning} warning</span>}
          </div>
        </div>
        <div className={`grid ${gridCols} gap-3`}>
          {beds.map(bed => <BedCard key={bed.deviceId} bed={bed} />)}
        </div>
      </div>
    );
  };

  const DetailRow: React.FC<{ label: string; value: string; valueColor?: string }> = ({ label, value, valueColor }) => (
    <div className="flex justify-between items-center text-sm">
      <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>{label}</span>
      <span className={`font-medium ${valueColor || (isDark ? 'text-white' : 'text-slate-900')}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Hospital Floor Map</h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Real-time device status across all hospital departments</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Total Beds</p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{HOSPITAL_BEDS.length}</p>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Healthy</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{totalHealthy}</p>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Warning</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{totalWarnings}</p>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Active Threats</p>
          <p className={`text-2xl font-bold mt-1 ${totalThreats > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{totalThreats}</p>
        </div>
      </div>

      <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0d1424] border border-gray-800' : 'bg-white border border-slate-200'} flex items-center space-x-6`}>
        <span className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Status:</span>
        <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div><span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Healthy</span></div>
        <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]"></div><span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Warning</span></div>
        <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse"></div><span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Threat Detected</span></div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-9 space-y-4">
          {renderZone('ICU', 'grid-cols-5', isDark ? 'bg-blue-500/5' : 'bg-blue-50/50')}
          <div className="grid grid-cols-2 gap-4">
            {renderZone('ER', 'grid-cols-3', isDark ? 'bg-orange-500/5' : 'bg-orange-50/50')}
            {renderZone('OR', 'grid-cols-2', isDark ? 'bg-purple-500/5' : 'bg-purple-50/50')}
          </div>
          {renderZone('Ward', 'grid-cols-4', isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/50')}
        </div>

        <div className="col-span-12 lg:col-span-3">
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200'} sticky top-0`}>
            <h3 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Device Details</h3>
            {selectedBed ? (
              <div className="space-y-3">
                <div className={`flex items-center space-x-2 p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <div className={`w-3 h-3 rounded-full ${getLedColors(selectedBed.status).dot} ${getLedColors(selectedBed.status).glow} ${getLedColors(selectedBed.status).pulse}`}></div>
                  <span className={`text-sm font-semibold capitalize ${getLedColors(selectedBed.status).text}`}>{selectedBed.status}</span>
                </div>
                <DetailRow label="Patient ID" value={selectedBed.patientId} />
                <DetailRow label="Location" value={`${selectedBed.zone} - Bed ${selectedBed.bedNumber}`} />
                <DetailRow label="Device" value={selectedBed.deviceName} />
                <DetailRow label="Device ID" value={selectedBed.deviceId} />
                <DetailRow label="IP Address" value={selectedBed.ipAddress} />
                <DetailRow label="Last Seen" value={selectedBed.lastSeen} />
                <DetailRow label="Threats" value={String(selectedBed.threatsDetected)} valueColor={selectedBed.threatsDetected > 0 ? 'text-red-500' : ''} />
                {selectedBed.status === 'threat' && (
                  <div className="pt-3 space-y-2">
                    <button className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition">Isolate Device</button>
                    <button className={`w-full px-3 py-2 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'} text-sm font-medium rounded-lg transition`}>View Alerts</button>
                  </div>
                )}
              </div>
            ) : (
              <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                <p className="text-sm">Click a bed to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalMap;
