'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isCoverage = pathname === '/coverage';
  const isMethod = pathname === '/method';

  return (
    <nav>
      <div className="navin">
        <Link href="/" className="logo">
          <img
            src="/logo-clean.png"
            alt="Waggle Logo"
            className="logo-img"
          />
          <span className="logo-text">waggle</span>
        </Link>
        <span className="navlinks">
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
        </span>
      </div>
    </nav>
  );
}
