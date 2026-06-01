import React from 'react';

export type LEDStatus = 'healthy' | 'warning' | 'threat';
export type LEDSize = 'sm' | 'md' | 'lg';

interface StatusLEDProps {
  status: LEDStatus;
  size?: LEDSize;
  label?: string;
  pulse?: boolean; // override default pulse (threats pulse by default)
}

/**
 * Reusable LED indicator for device/zone status.
 * Green = healthy, Yellow = warning, Red = threat (pulses by default).
 */
const StatusLED: React.FC<StatusLEDProps> = ({ status, size = 'md', label, pulse }) => {
  const config = {
    healthy: {
      dot: 'bg-emerald-500',
      glow: 'shadow-[0_0_8px_rgba(16,185,129,0.6)]',
      text: 'text-emerald-500',
      defaultPulse: false,
    },
    warning: {
      dot: 'bg-amber-400',
      glow: 'shadow-[0_0_10px_rgba(251,191,36,0.7)]',
      text: 'text-amber-500',
      defaultPulse: false,
    },
    threat: {
      dot: 'bg-red-500',
      glow: 'shadow-[0_0_12px_rgba(239,68,68,0.85)]',
      text: 'text-red-500',
      defaultPulse: true,
    },
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const cfg = config[status];
  const shouldPulse = pulse ?? cfg.defaultPulse;

  return (
    <span className="inline-flex items-center space-x-2">
      <span
        className={`${sizeClasses[size]} rounded-full ${cfg.dot} ${cfg.glow} ${shouldPulse ? 'animate-pulse' : ''}`}
        aria-label={`Status: ${status}`}
      />
      {label && <span className={`text-xs font-semibold ${cfg.text}`}>{label}</span>}
    </span>
  );
};

export default StatusLED;
