import React from 'react';

interface MedicalLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPulse?: boolean;
}

export const MedicalLogo: React.FC<MedicalLogoProps> = ({
  className = '',
  size = 'md',
  showPulse = true,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 p-0.5 shadow-md shadow-emerald-600/25 flex items-center justify-center shrink-0 transition-transform hover:scale-105 ${sizeMap[size]} ${className}`}
    >
      {/* Medical Cross & ECG Pulse Emblem */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Soft background shape */}
        <rect width="48" height="48" rx="14" fill="url(#medicalGradient)" />

        {/* Crisp Medical Cross (Plus) */}
        <path
          d="M19 9C19 7.89543 19.8954 7 21 7H27C28.1046 7 29 7.89543 29 9V19H39C40.1046 19 41 19.8954 41 21V27C41 28.1046 40.1046 29 39 29H29V39C29 40.1046 28.1046 41 27 41H21C19.8954 41 19 40.1046 19 39V29H9C7.89543 29 7 28.1046 7 27V21C7 19.8954 7.89543 19 9 19H19V9Z"
          fill="white"
        />

        {/* Medical Heartbeat (ECG Pulse line) across the center */}
        <path
          d="M11 24H18L21 16L25 32L28 20L30.5 24H37"
          stroke="#059669"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <defs>
          <linearGradient
            id="medicalGradient"
            x1="0"
            y1="0"
            x2="48"
            y2="48"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#047857" />
            <stop offset="0.5" stopColor="#0D9488" />
            <stop offset="1" stopColor="#0284C7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Online indicator ping */}
      {showPulse && (
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white shadow-xs" />
        </span>
      )}
    </div>
  );
};
