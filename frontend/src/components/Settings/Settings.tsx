import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    systemName: 'AEGIS Hospital Network',
    timezone: 'UTC+2 (Cairo)',
    language: 'English',
    darkMode: isDark,
    autoBlock: true,
    threatThreshold: 90,
    sessionTimeout: 30,
    mfaEnabled: true,
    networkInterface: 'eth0',
    ipAddress: '10.0.0.5',
    subnetMask: '255.255.255.0',
    gateway: '10.0.0.1',
    dnsServer: '8.8.8.8',
    emailAlerts: true,
    smsAlerts: false,
    slackIntegration: true,
    emailAddress: 'admin@hospital.com',
    apiEnabled: true,
    apiKey: 'aegis_xxxx_xxxx_xxxx',
    rateLimit: 1000,
  });

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'security', name: 'Security', icon: '🛡️' },
    { id: 'network', name: 'Network', icon: '🌐' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'api', name: 'API', icon: '</>' },
    { id: 'about', name: 'About', icon: 'ℹ️' },
  ];

  const bgMain = isDark ? 'bg-[#0a0f1c]' : 'bg-gray-100';
  const bgCard = isDark ? 'bg-gradient-to-br from-[#0d1424] to-[#1a1f2e]' : 'bg-white';
  const bgInput = isDark ? 'bg-[#0a0f1c]' : 'bg-gray-50';
  const borderColor = isDark ? 'border-gray-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-500' : 'text-gray-500';

  const handleDarkModeToggle = () => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
    toggleTheme();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-1`}>General Settings</h3>
              <p className={textMuted}>Basic system configuration</p>
            </div>
            <div>
              <label className={`block ${textSecondary} text-sm mb-2`}>System Name</label>
              <input type="text" value={settings.systemName}
                onChange={(e) => setSettings({...settings, systemName: e.target.value})}
                className={`w-full ${bgInput} ${textPrimary} px-4 py-3 rounded-lg border ${borderColor} focus:outline-none focus:border-blue-500`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block ${textSecondary} text-sm mb-2`}>Timezone</label>
                <select value={settings.timezone}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  className={`w-full ${bgInput} ${textPrimary} px-4 py-3 rounded-lg border ${borderColor}`}>
                  <option>UTC+2 (Cairo)</option>
                  <option>UTC+3 (Riyadh)</option>
                  <option>UTC+0 (London)</option>
                </select>
              </div>
              <div>
                <label className={`block ${textSecondary} text-sm mb-2`}>Language</label>
                <select value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value})}
                  className={`w-full ${bgInput} ${textPrimary} px-4 py-3 rounded-lg border ${borderColor}`}>
                  <option>English</option>
                  <option>Arabic</option>
                </select>
              </div>
            </div>
            <div className={`flex items-center justify-between p-4 ${bgInput} rounded-lg border ${borderColor}`}>
              <div>
                <p className={textPrimary}>Dark Mode</p>
                <p className={`${textMuted} text-sm`}>Use dark theme for the interface</p>
              </div>
              <button onClick={handleDarkModeToggle}
                className={`w-14 h-7 rounded-full transition-colors relative ${settings.darkMode ? 'bg-blue-600' : 'bg-gray-400'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${settings.darkMode ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-1`}>Security Settings</h3>
              <p className={textMuted}>Configure threat detection and access control</p>
            </div>
            <div className={`flex items-center justify-between p-4 ${bgInput} rounded-lg border ${borderColor}`}>
              <div>
                <p className={textPrimary}>Auto-Block Threats</p>
                <p className={`${textMuted} text-sm`}>Automatically block detected threats</p>
              </div>
              <button onClick={() => setSettings({...settings, autoBlock: !settings.autoBlock})}
                className={`w-14 h-7 rounded-full transition-colors relative ${settings.autoBlock ? 'bg-blue-600' : 'bg-gray-400'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${settings.autoBlock ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <div>
              <label className={`block ${textSecondary} text-sm mb-2`}>Threat Confidence Threshold: {settings.threatThreshold}%</label>
              <input type="range" min="50" max="100" value={settings.threatThreshold}
                onChange={(e) => setSettings({...settings, threatThreshold: parseInt(e.target.value)})}
                className="w-full" />
            </div>
            <div className={`flex items-center justify-between p-4 ${bgInput} rounded-lg border ${borderColor}`}>
              <div>
                <p className={textPrimary}>Two-Factor Authentication</p>
                <p className={`${textMuted} text-sm`}>Require MFA for admin access</p>
              </div>
              <button onClick={() => setSettings({...settings, mfaEnabled: !settings.mfaEnabled})}
                className={`w-14 h-7 rounded-full transition-colors relative ${settings.mfaEnabled ? 'bg-blue-600' : 'bg-gray-400'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${settings.mfaEnabled ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        );
      case 'network':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-1`}>Network Settings</h3>
              <p className={textMuted}>Configure network interface and connectivity</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block ${textSecondary} text-sm mb-2`}>IP Address</label>
                <input type="text" value={settings.ipAddress}
                  onChange={(e) => setSettings({...settings, ipAddress: e.target.value})}
                  className={`w-full ${bgInput} ${textPrimary} px-4 py-3 rounded-lg border ${borderColor}`} />
              </div>
              <div>
                <label className={`block ${textSecondary} text-sm mb-2`}>Subnet Mask</label>
                <input type="text" value={settings.subnetMask}
                  onChange={(e) => setSettings({...settings, subnetMask: e.target.value})}
                  className={`w-full ${bgInput} ${textPrimary} px-4 py-3 rounded-lg border ${borderColor}`} />
              </div>
              <div>
                <label className={`block ${textSecondary} text-sm mb-2`}>Gateway</label>
                <input type="text" value={settings.gateway}
                  onChange={(e) => setSettings({...settings, gateway: e.target.value})}
                  className={`w-full ${bgInput} ${textPrimary} px-4 py-3 rounded-lg border ${borderColor}`} />
              </div>
              <div>
                <label className={`block ${textSecondary} text-sm mb-2`}>DNS Server</label>
                <input type="text" value={settings.dnsServer}
                  onChange={(e) => setSettings({...settings, dnsServer: e.target.value})}
                  className={`w-full ${bgInput} ${textPrimary} px-4 py-3 rounded-lg border ${borderColor}`} />
              </div>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">💡 Connected to OMNeT++ simulation at localhost:8000</p>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-1`}>Notification Settings</h3>
              <p className={textMuted}>Configure alerts and integrations</p>
            </div>
            {[{key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive threat alerts via email'},
              {key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive critical alerts via SMS'},
              {key: 'slackIntegration', label: 'Slack Integration', desc: 'Post alerts to Slack'}
            ].map(item => (
              <div key={item.key} className={`flex items-center justify-between p-4 ${bgInput} rounded-lg border ${borderColor}`}>
                <div>
                  <p className={textPrimary}>{item.label}</p>
                  <p className={`${textMuted} text-sm`}>{item.desc}</p>
                </div>
                <button onClick={() => setSettings({...settings, [item.key]: !(settings as any)[item.key]})}
                  className={`w-14 h-7 rounded-full transition-colors relative ${(settings as any)[item.key] ? 'bg-blue-600' : 'bg-gray-400'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${(settings as any)[item.key] ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            ))}
          </div>
        );
      case 'api':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-1`}>API Settings</h3>
              <p className={textMuted}>Manage API access and credentials</p>
            </div>
            <div className={`flex items-center justify-between p-4 ${bgInput} rounded-lg border ${borderColor}`}>
              <div>
                <p className={textPrimary}>API Access</p>
                <p className={`${textMuted} text-sm`}>Enable REST API</p>
              </div>
              <button onClick={() => setSettings({...settings, apiEnabled: !settings.apiEnabled})}
                className={`w-14 h-7 rounded-full transition-colors relative ${settings.apiEnabled ? 'bg-blue-600' : 'bg-gray-400'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${settings.apiEnabled ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <div className={`p-4 ${bgInput} rounded-lg border ${borderColor}`}>
              <p className={`${textSecondary} text-sm mb-2`}>API Endpoints:</p>
              <code className={`${textMuted} text-xs font-mono`}>
                GET /api/network/attacks<br/>
                GET /api/threats/stats<br/>
                WS /ws (WebSocket)
              </code>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="space-y-6">
            <div className={`p-6 ${bgInput} rounded-xl border ${borderColor} text-center`}>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🛡️</span>
              </div>
              <h2 className={`text-2xl font-bold ${textPrimary}`}>AEGIS</h2>
              <p className="text-blue-500 mb-2">AI-Enhanced Guardian for IoT Security</p>
              <p className={textMuted}>Version 1.0.0</p>
            </div>
            <div className={`p-4 ${bgInput} rounded-lg border ${borderColor}`}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className={textMuted}>AI Accuracy</p><p className={`${textPrimary} font-bold text-lg`}>96.22%</p></div>
                <div><p className={textMuted}>Attack Types</p><p className={`${textPrimary} font-bold text-lg`}>9 Types</p></div>
                <div><p className={textMuted}>Devices</p><p className={`${textPrimary} font-bold text-lg`}>85</p></div>
                <div><p className={textMuted}>Simulation</p><p className={`${textPrimary} font-bold text-lg`}>OMNeT++</p></div>
              </div>
            </div>
            <div className={`p-4 ${bgInput} rounded-lg border ${borderColor}`}>
              <p className={`${textSecondary} text-sm mb-2`}>Tech Stack:</p>
              <div className="flex flex-wrap gap-2">
                {['React', 'TypeScript', 'FastAPI', 'Python', 'TensorFlow', 'OMNeT++'].map(t => (
                  <span key={t} className={`px-3 py-1 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full text-xs ${textSecondary}`}>{t}</span>
                ))}
              </div>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">🎓 Graduation Project - ITCS Department © 2025</p>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen ${bgMain} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${textPrimary} mb-1`}>Settings</h1>
          <p className={textSecondary}>Configure AEGIS IDS system preferences</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2">
          <span>💾</span><span>Save Changes</span>
        </button>
      </div>
      <div className="flex gap-6">
        <div className={`w-64 ${bgCard} rounded-2xl border ${borderColor} p-4`}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left mb-1 ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : `${textSecondary} hover:bg-opacity-50`
              }`}>
              <span>{tab.icon}</span><span>{tab.name}</span>
            </button>
          ))}
        </div>
        <div className={`flex-1 ${bgCard} rounded-2xl border ${borderColor} p-6`}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
