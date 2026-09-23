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
  const norm = (chainKey || chainName).toLowerCase();

  let imgSrc = '';
  if (norm.includes('sol')) imgSrc = '/logos/solana.png';
  else if (norm.includes('base')) imgSrc = '/logos/base.png';
  else if (norm.includes('bnb') || norm.includes('bsc')) imgSrc = '/logos/bnb.png';
  else if (norm.includes('rh') || norm.includes('robinhood')) imgSrc = '/logos/robinhood.png';
  else if (norm.includes('arc')) imgSrc = '/logos/arc.jpeg';

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={chainName || chainKey}
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          transform: imgSrc.includes('bnb') ? 'scale(1.35)' : undefined,
          borderRadius: '4px',
          flexShrink: 0
        }}
        onError={(e) => {
          // Hide broken img fallback gracefully
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // Fallback icon
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '4px',
        backgroundColor: '#0052FF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 'bold',
        color: 'white',
        flexShrink: 0
      }}
    >
      {(chainName || chainKey || 'C')[0].toUpperCase()}
    </div>
  );
};
