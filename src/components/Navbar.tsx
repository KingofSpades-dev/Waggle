'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
          <Link href="/method" className={isMethod ? 'active' : ''}>
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
          <a
            href="https://x.com/wagglescout"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X / Twitter @wagglescout"
            style={{
              color: 'var(--navy-800)',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid var(--line)'
            }}
            title="Follow @wagglescout on X"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>@wagglescout</span>
          </a>
        </span>

        {/* Mobile Hamburger Toggle Button Container */}
        <div className="nav-wallet-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              href="/method"
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
            <a
              href="https://x.com/wagglescout"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="m-icon">𝕏</span> @wagglescout
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
