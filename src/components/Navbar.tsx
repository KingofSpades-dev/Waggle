'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnectModal from '@/components/WalletConnectModal';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = pathname === '/';
  const isCoverage = pathname === '/coverage';
  const isMethod = pathname === '/method';

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="navbar-container">
      <div className="navin">
        <Link href="/" className="logo">
          <img
            src="/logo-clean.png"
            alt="Waggle Logo"
            className="logo-img"
          />
          <span className="logo-text">waggle</span>
        </Link>

        {/* Desktop Links */}
        <span className="navlinks desktop-navlinks">
          <Link href="/" className={isHome ? 'active' : ''}>
            scout
          </Link>
          <Link href="/#hours">
            hours
          </Link>
          <Link href="/#venues">
            launchpads
          </Link>
          <Link href="/#method" className={isMethod ? 'active' : ''}>
            method
          </Link>
          <Link href="/coverage" className={isCoverage ? 'active' : ''}>
            coverage
          </Link>
          <Link href="/robinhood" className={pathname === '/robinhood' ? 'active' : ''}>
            robinhood
          </Link>
          <Link href="/verify" className={pathname === '/verify' ? 'active' : ''}>
            verify
          </Link>
        </span>

        {/* RainbowKit / Web3 Wallet Connect */}
        <div className="nav-wallet-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <WalletConnectModal />

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu-drawer">
          <div className="mobile-navlinks">
            <Link
              href="/"
              className={isHome ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="m-icon">🎯</span> scout
            </Link>
            <Link
              href="/#hours"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="m-icon">⏰</span> hours
            </Link>
            <Link
              href="/#venues"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="m-icon">🚀</span> launchpads
            </Link>
            <Link
              href="/#method"
              className={isMethod ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="m-icon">📐</span> method
            </Link>
            <Link
              href="/coverage"
              className={isCoverage ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="m-icon">🌐</span> coverage
            </Link>
            <Link
              href="/robinhood"
              className={pathname === '/robinhood' ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="m-icon">🏹</span> robinhood
            </Link>
            <Link
              href="/verify"
              className={pathname === '/verify' ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="m-icon">🛡️</span> verify
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
