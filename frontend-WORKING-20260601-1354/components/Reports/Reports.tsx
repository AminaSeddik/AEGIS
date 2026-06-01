import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../ThemeContext';

interface ThreatRecord {
  id: number;
  timestamp: string;
  threat_type: string;
  severity: string;
  confidence: number;
  device_id: string;
  device_name: string;
  zone: string;
  status: string;
  description: string;
}

interface DailyReport {
  date: string;
  total_threats: number;
  blocked: number;
  investigating: number;
  active: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_zone: Record<string, number>;
  by_status: Record<string, number>;
  threats: ThreatRecord[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-500 border-red-500/40',
  high: 'bg-orange-500/20 text-orange-500 border-orange-500/40',
  medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40',
  low: 'bg-blue-500/20 text-blue-500 border-blue-500/40',
};

const ATTACK_TYPE_COLORS: Record<string, string> = {
  DDoS: '#ef4444',
  DoS: '#f97316',
  ICMP_Flood: '#06b6d4',
  ARP_Spoofing: '#10b981',
  MQTT_Attack: '#ec4899',
  Ransomware: '#8b5cf6',
  Reconnaissance: '#6366f1',
  Data_Exfiltration: '#f59e0b',
  Benign: '#22c55e',
};

const Reports: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/reports/daily?date=${date}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate, fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const yesterday = (() => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const tomorrow = (() => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const isToday = selectedDate === today;

  const card = (label: string, value: number | string, color: string) => (
    <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200'}`}>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );

  const breakdownTable = (title: string, data: Record<string, number>, totalKey?: string) => {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    if (entries.length === 0) {
      return (
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200'}`}>
          <h3 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>No data for this day.</p>
        </div>
      );
    }
    return (
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        <div className="space-y-2">
          {entries.map(([key, count]) => {
            const pct = total > 0 ? (count / total) * 100 : 0;
            const color = ATTACK_TYPE_COLORS[key] || '#888';
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>{key}</span>
                  <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {count} <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>({pct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 print:bg-white">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Daily Reports</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Auto-generated summary of threats and incidents
          </p>
        </div>
        <div className="flex items-center space-x-2 print:hidden">
          <button
            onClick={() => setSelectedDate(yesterday)}
            className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
          >
            ‹ Previous
          </button>
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-[#0d1424] border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
          />
          <button
            onClick={() => setSelectedDate(tomorrow)}
            disabled={isToday}
            className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-white/5 hover:bg-white/10 text-white disabled:opacity-30' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 disabled:opacity-30'}`}
          >
            Next ›
          </button>
          <button
            onClick={() => setSelectedDate(today)}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
          >
            Today
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Date banner */}
      <div className={`p-4 rounded-xl border-2 ${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50/50 border-blue-200'}`}>
        <p className={`text-sm uppercase tracking-wider font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
          Report for
        </p>
        <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {formatDate(selectedDate)}
        </p>
      </div>

      {/* Loading / error */}
      {loading && (
        <div className={`p-8 text-center ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Loading report…</div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-500">
          {error} — is the AI server running on port 8000?
        </div>
      )}

      {/* Report body */}
      {report && !loading && (
        <>
          {/* Summary line for at-a-glance */}
          <div className={`p-4 rounded-xl ${isDark ? 'bg-[#0d1424] border border-gray-800' : 'bg-white border border-slate-200'}`}>
            <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
              {report.total_threats === 0 ? (
                <>No threats were detected on this day. All systems healthy.</>
              ) : (
                <>
                  <span className="font-bold">{report.total_threats}</span> threat{report.total_threats !== 1 ? 's' : ''} detected
                  {report.blocked > 0 && <> · <span className="font-bold text-emerald-500">{report.blocked} blocked</span></>}
                  {report.investigating > 0 && <> · <span className="font-bold text-amber-500">{report.investigating} under investigation</span></>}
                  {report.active > 0 && <> · <span className="font-bold text-red-500">{report.active} still active</span></>}
                </>
              )}
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {card('Total Threats', report.total_threats, isDark ? 'text-white' : 'text-slate-900')}
            {card('Blocked', report.blocked, 'text-emerald-500')}
            {card('Investigating', report.investigating, 'text-amber-500')}
            {card('Active', report.active, report.active > 0 ? 'text-red-500' : 'text-emerald-500')}
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {breakdownTable('By Attack Type', report.by_type)}
            {breakdownTable('By Severity', report.by_severity)}
            {breakdownTable('By Zone', report.by_zone)}
          </div>

          {/* Detail table */}
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0d1424] border-gray-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              All Threats ({report.threats.length})
            </h3>
            {report.threats.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>No threat records.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-left ${isDark ? 'text-gray-400 border-b border-gray-800' : 'text-slate-600 border-b border-slate-200'}`}>
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Severity</th>
                      <th className="py-2 pr-3">Zone</th>
                      <th className="py-2 pr-3">Device</th>
                      <th className="py-2 pr-3">Confidence</th>
                      <th className="py-2 pr-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.threats.map((t) => (
                      <tr key={t.id} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-slate-100'}`}>
                        <td className={`py-2 pr-3 font-mono text-xs ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `${ATTACK_TYPE_COLORS[t.threat_type] || '#888'}25`,
                              color: ATTACK_TYPE_COLORS[t.threat_type] || '#888',
                            }}
                          >
                            {t.threat_type}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={`px-2 py-0.5 rounded text-xs border ${SEVERITY_COLORS[t.severity] || ''}`}>
                            {t.severity}
                          </span>
                        </td>
                        <td className={`py-2 pr-3 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{t.zone}</td>
                        <td className={`py-2 pr-3 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t.device_name}</td>
                        <td className={`py-2 pr-3 font-mono ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                          {t.confidence.toFixed(1)}%
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              t.status === 'active'
                                ? 'bg-red-500/20 text-red-500'
                                : t.status === 'blocked'
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : 'bg-amber-500/20 text-amber-500'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer for print */}
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'} text-center pt-4 pb-2`}>
            Generated by AEGIS · {new Date().toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
