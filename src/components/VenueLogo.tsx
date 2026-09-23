import React from 'react';

interface VenueLogoProps {
  venueKey?: string;
  venueName?: string;
  chainKey?: string;
  size?: number;
  className?: string;
}

export const VenueLogo: React.FC<VenueLogoProps> = ({
  venueKey = '',
  venueName = '',
  chainKey = '',
  size = 22,
  className = ''
}) => {
  const norm = (venueKey + ' ' + venueName).toLowerCase();

  let imgSrc = '';
  if (norm.includes('pump')) imgSrc = '/logos/pump.png';
  else if (norm.includes('bonk')) imgSrc = '/logos/bonk.png';
  else if (norm.includes('bag')) imgSrc = '/logos/bags.png';
  else if (norm.includes('meteora')) imgSrc = '/logos/meteora.svg';
  else if (norm.includes('clanker')) imgSrc = '/logos/clanker.png';
  else if (norm.includes('virtual')) imgSrc = '/logos/virtuals.png';
  else if (norm.includes('zora')) imgSrc = '/logos/zora.svg';
  else if (norm.includes('aero')) imgSrc = '/logos/aerodrome.svg';
  else if (norm.includes('four')) imgSrc = '/logos/fourmeme.svg';
  else if (norm.includes('pancake')) imgSrc = '/logos/pancakeswap.png';
  else if (norm.includes('pons')) imgSrc = '/logos/pons.png';
  else if (norm.includes('pools')) imgSrc = '/logos/pools.png';
  else if (norm.includes('hood')) imgSrc = '/logos/hood.png';
  else if (norm.includes('robinhood')) imgSrc = '/logos/robinhood.png';
  else if (norm.includes('arc') && norm.includes('swap')) imgSrc = '/logos/arcswap.png';
  else if (norm.includes('astro')) imgSrc = '/logos/astrovault.png';
  else if (norm.includes('raydium')) imgSrc = '/logos/raydium.png';

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={venueName || venueKey}
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          transform: imgSrc.includes('bnb') ? 'scale(1.35)' : undefined,
          borderRadius: '6px',
          flexShrink: 0
        }}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // Fallback badge
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '6px',
        backgroundColor: '#374151',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 'bold',
        color: 'white',
        flexShrink: 0
      }}
    >
      {(venueName || venueKey || 'V').slice(0, 2).toUpperCase()}
    </div>
  );
};
