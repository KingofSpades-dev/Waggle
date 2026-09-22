import React from 'react';

interface ChainLogoProps {
  chainKey?: string;
  chainName?: string;
  size?: number;
  className?: string;
}

export const ChainLogo: React.FC<ChainLogoProps> = ({
  chainKey = '',
  chainName = '',
  size = 18,
  className = ''
}) => {
  const normalized = (chainKey || chainName).toLowerCase();

  // 1. Solana (Official gradient 3 diagonal bars)
  if (normalized.includes('sol')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '4px' }}
      >
        <defs>
          <linearGradient id="solGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FFA3" />
            <stop offset="100%" stopColor="#DC1FFF" />
          </linearGradient>
          <linearGradient id="solGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC1FFF" />
            <stop offset="100%" stopColor="#00FFA3" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="26" fill="#141026" />
        <path
          d="M31.2 88.5c1-1 2.4-1.6 3.9-1.6h68.2c2.4 0 3.7 2.9 2 4.6l-11.2 11.2c-1 1-2.4 1.6-3.9 1.6H22c-2.4 0-3.7-2.9-2-4.6l11.2-11.2z"
          fill="url(#solGrad1)"
        />
        <path
          d="M31.2 23.7c1-1 2.4-1.6 3.9-1.6h68.2c2.4 0 3.7 2.9 2 4.6L94.1 37.9c-1 1-2.4 1.6-3.9 1.6H22c-2.4 0-3.7-2.9-2-4.6l11.2-11.2z"
          fill="url(#solGrad1)"
        />
        <path
          d="M96.8 56.1c-1-1-2.4-1.6-3.9-1.6H24.7c-2.4 0-3.7 2.9-2 4.6L33.9 70.3c1 1 2.4 1.6 3.9 1.6H106c2.4 0 3.7-2.9 2-4.6L96.8 56.1z"
          fill="url(#solGrad2)"
        />
      </svg>
    );
  }

  // 2. Base (Official Coinbase Base blue circle)
  if (normalized.includes('base')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '4px' }}
      >
        <rect width="128" height="128" rx="26" fill="#0052FF" />
        <circle cx="64" cy="64" r="38" fill="white" />
        <circle cx="64" cy="64" r="22" fill="#0052FF" />
      </svg>
    );
  }

  // 3. BNB Chain (Official Binance yellow/gold diamond)
  if (normalized.includes('bnb') || normalized.includes('bsc')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '4px' }}
      >
        <rect width="128" height="128" rx="26" fill="#F0B90B" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M64 25L42.5 46.5L52.5 56.5L64 45L75.5 56.5L85.5 46.5L64 25ZM25 64L35 54L45 64L35 74L25 64ZM83 64L93 54L103 64L93 74L83 64ZM64 83L52.5 71.5L42.5 81.5L64 103L85.5 81.5L75.5 71.5L64 83ZM64 54L54 64L64 74L74 64L64 54Z"
          fill="#1E2026"
        />
      </svg>
    );
  }

  // 4. Robinhood Chain (Official Robinhood vibrant green feather emblem)
  if (normalized.includes('rh') || normalized.includes('robinhood')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '4px' }}
      >
        <rect width="128" height="128" rx="26" fill="#00C805" />
        {/* Robinhood Feather Emblem */}
        <path
          d="M78 26C52 34 38 60 38 88c0 7 2 14 6 16 4 2 10-2 14-8 4-6 6-16 8-28 2 10 6 22 12 28 4 4 9 5 11 2 3-4 1-14-2-26 10 14 16 22 17 24 2 3 6 4 8 1 2-2 1-8-2-15-5-11-13-28-25-56z"
          fill="white"
        />
      </svg>
    );
  }

  // 5. Arc / Archway (Official Archway orange archway loop)
  if (normalized.includes('arc')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '4px' }}
      >
        <rect width="128" height="128" rx="26" fill="#FF4D00" />
        <path
          d="M40 94V58C40 44.7 50.7 34 64 34C77.3 34 88 44.7 88 58V94H74V58C74 52.5 69.5 48 64 48C58.5 48 54 52.5 54 58V94H40Z"
          fill="white"
        />
        <circle cx="64" cy="74" r="7" fill="white" />
      </svg>
    );
  }

  // Default fallback
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '4px',
        backgroundColor: '#6B7280',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 'bold',
        color: 'white'
      }}
    >
      {chainName ? chainName[0].toUpperCase() : 'C'}
    </div>
  );
};
