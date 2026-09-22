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

  // 1. Pump.fun (Iconic green & white capsule pill)
  if (norm.includes('pump')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#0D131A" />
        {/* Pill rotated 45 deg */}
        <g transform="rotate(-45 32 32)">
          <rect x="22" y="14" width="20" height="18" rx="10" fill="#22C55E" />
          <rect x="22" y="32" width="20" height="18" rx="10" fill="#FFFFFF" />
          <line x1="22" y1="32" x2="42" y2="32" stroke="#166534" strokeWidth="2" />
        </g>
      </svg>
    );
  }

  // 2. Bonk.fun (BONK orange dog mascot)
  if (norm.includes('bonk')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#FF8A00" />
        {/* Dog ears & face */}
        <circle cx="32" cy="35" r="18" fill="#FFC72C" />
        <polygon points="18,18 26,30 16,32" fill="#D95700" />
        <polygon points="46,18 48,32 38,30" fill="#D95700" />
        <circle cx="26" cy="33" r="3" fill="#1C1917" />
        <circle cx="38" cy="33" r="3" fill="#1C1917" />
        <ellipse cx="32" cy="40" rx="4" ry="2.5" fill="#1C1917" />
        <ellipse cx="32" cy="43" rx="7" ry="4" fill="#FFEAA7" opacity="0.6" />
      </svg>
    );
  }

  // 3. Bags (Bags green explorer backpack)
  if (norm.includes('bag')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#10B981" />
        {/* Backpack strap and bag */}
        <path d="M26 20C26 16.7 28.7 14 32 14C35.3 14 38 16.7 38 20" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <rect x="20" y="22" width="24" height="28" rx="6" fill="white" />
        <rect x="24" y="32" width="16" height="14" rx="3" fill="#047857" />
        <line x1="20" y1="28" x2="44" y2="28" stroke="#059669" strokeWidth="2.5" />
      </svg>
    );
  }

  // 4. Raydium CPMM (Raydium geometric cyan/purple laser rays)
  if (norm.includes('raydium')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#141026" />
        <circle cx="32" cy="32" r="14" stroke="#22D3EE" strokeWidth="4" />
        <path d="M32 12L42 22L32 32" stroke="#A855F7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="32" cy="32" r="4" fill="#22D3EE" />
      </svg>
    );
  }

  // 5. Meteora DLMM (Meteora cosmic vortex / star swirl)
  if (norm.includes('meteora')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#1E1B4B" />
        <path d="M18 32C18 24.3 24.3 18 32 18C39.7 18 46 24.3 46 32C46 39.7 39.7 46 32 46" stroke="#818CF8" strokeWidth="4" strokeLinecap="round" />
        <circle cx="32" cy="32" r="7" fill="#C084FC" />
        <circle cx="42" cy="22" r="3" fill="#F43F5E" />
      </svg>
    );
  }

  // 6. Clanker (Metallic blue robot icon)
  if (norm.includes('clanker')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#0F172A" />
        {/* Antenna */}
        <line x1="32" y1="12" x2="32" y2="20" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="11" r="3" fill="#38BDF8" />
        {/* Robot Head */}
        <rect x="18" y="20" width="28" height="26" rx="6" fill="#334155" stroke="#38BDF8" strokeWidth="2.5" />
        {/* Glowing Eyes */}
        <rect x="23" y="27" width="6" height="5" rx="1.5" fill="#38BDF8" />
        <rect x="35" y="27" width="6" height="5" rx="1.5" fill="#38BDF8" />
        {/* Smile grill */}
        <line x1="25" y1="38" x2="39" y2="38" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 7. Virtuals Protocol (AI Agent glowing V logo)
  if (norm.includes('virtual')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#001833" />
        <path d="M18 18L32 46L46 18H37L32 30L27 18H18Z" fill="#00E5FF" />
        <circle cx="32" cy="46" r="3" fill="#00FFA3" />
      </svg>
    );
  }

  // 8. Zora Protocol (Zora iridescent sphere)
  if (norm.includes('zora')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <defs>
          <radialGradient id="zoraGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#80E9FF" />
            <stop offset="50%" stopColor="#4361EE" />
            <stop offset="100%" stopColor="#0B132B" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="#0B132B" />
        <circle cx="32" cy="32" r="19" fill="url(#zoraGrad)" />
      </svg>
    );
  }

  // 9. Aerodrome SlipStream (Aero dual-blade propeller)
  if (norm.includes('aero')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#0284C7" />
        {/* Propeller blades */}
        <ellipse cx="32" cy="20" rx="6" ry="12" fill="white" transform="rotate(-15 32 20)" />
        <ellipse cx="32" cy="44" rx="6" ry="12" fill="white" transform="rotate(-15 32 44)" />
        <ellipse cx="20" cy="32" rx="12" ry="6" fill="white" transform="rotate(-15 20 32)" opacity="0.85" />
        <ellipse cx="44" cy="32" rx="12" ry="6" fill="white" transform="rotate(-15 44 32)" opacity="0.85" />
        <circle cx="32" cy="32" r="5" fill="#0369A1" />
      </svg>
    );
  }

  // 10. Four.meme (Yellow 4 meme badge)
  if (norm.includes('four')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#FACC15" />
        <path d="M38 18V44M38 44H44M38 44H22L36 18" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="44" cy="22" r="3" fill="#DC2626" />
      </svg>
    );
  }

  // 11. Gra.fun (Floki fair curve mascot / bone)
  if (norm.includes('gra')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#7C3AED" />
        {/* Playful ghost/floki bone */}
        <path d="M22 24C22 18 26 14 32 14C38 14 42 18 42 24V46L37 42L32 46L27 42L22 46V24Z" fill="white" />
        <circle cx="28" cy="24" r="2.5" fill="#5B21B6" />
        <circle cx="36" cy="24" r="2.5" fill="#5B21B6" />
      </svg>
    );
  }

  // 12. PancakeSwap v3 (Pancake bunny mascot)
  if (norm.includes('pancake')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#D1884F" />
        {/* Bunny ears */}
        <ellipse cx="26" cy="22" rx="4" ry="10" fill="#FFE3A8" transform="rotate(-15 26 22)" />
        <ellipse cx="38" cy="22" rx="4" ry="10" fill="#FFE3A8" transform="rotate(15 38 22)" />
        {/* Pancake head */}
        <circle cx="32" cy="38" r="16" fill="#FFE3A8" />
        {/* Butter pad */}
        <rect x="29" y="28" width="6" height="5" rx="1" fill="#FCD34D" />
        <circle cx="27" cy="38" r="2" fill="#78350F" />
        <circle cx="37" cy="38" r="2" fill="#78350F" />
      </svg>
    );
  }

  // 13. Pons (Robinhood Chain Direct Liquidity Bridge)
  if (norm.includes('pons')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#047857" />
        {/* Bridge arches (Pons means bridge) */}
        <path d="M16 42C16 33 23 26 32 26C41 26 48 33 48 42" stroke="#34D399" strokeWidth="4" strokeLinecap="round" />
        <path d="M22 44C22 38 26.5 34 32 34C37.5 34 42 38 42 44" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="44" x2="50" y2="44" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="32" cy="20" r="3.5" fill="#34D399" />
      </svg>
    );
  }

  // 14. Pools.trade (Direct pools liquidity waves)
  if (norm.includes('pools')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#0D9488" />
        {/* Dual liquidity curves */}
        <path d="M16 28C22 22 28 34 34 28C40 22 44 26 48 24" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M16 38C22 32 28 44 34 38C40 32 44 36 48 34" stroke="#99F6E4" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="48" cy="24" r="3" fill="#FDE047" />
      </svg>
    );
  }

  // 15. hood.fun (Robinhood Chain bonding curve - neon hoodie badge)
  if (norm.includes('hood')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#052E16" />
        {/* Hoodie outline */}
        <path d="M32 16C23 16 18 24 18 36C18 44 24 48 32 48C40 48 46 44 46 36C46 24 41 16 32 16Z" fill="#15803D" stroke="#22C55E" strokeWidth="2.5" />
        {/* Face opening */}
        <ellipse cx="32" cy="34" rx="7" ry="10" fill="#052E16" />
        {/* Smiling glow inside hood */}
        <path d="M29 34L32 37L35 34" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 16. ArcSwap (Dual arrow swap on Arc)
  if (norm.includes('arc_swap') || norm.includes('arcswap')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#EA580C" />
        {/* Circular swap arrows */}
        <path d="M20 30H42M42 30L34 22" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44 36H22M22 36L30 44" stroke="#FED7AA" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 17. Astrovault 1:1 AXV (Cosmic star-vault)
  if (norm.includes('astro')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0, borderRadius: '6px' }}
      >
        <rect width="64" height="64" rx="14" fill="#7C2D12" />
        {/* Cosmic Vault Hexagon */}
        <polygon points="32,16 46,24 46,40 32,48 18,40 18,24" fill="#F97316" stroke="#FDBA74" strokeWidth="2" />
        <circle cx="32" cy="32" r="5" fill="#FEF08A" />
      </svg>
    );
  }

  // Fallback icon based on chain
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '6px',
        backgroundColor: '#4B5563',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 'bold',
        color: 'white',
        flexShrink: 0
      }}
    >
      {venueName ? venueName.slice(0, 2).toUpperCase() : 'V'}
    </div>
  );
};
