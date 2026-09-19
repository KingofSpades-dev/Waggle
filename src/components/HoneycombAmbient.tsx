'use client';

import React from 'react';

export default function HoneycombAmbient() {
  return (
    <div className="honeycomb-ambient-wrap" aria-hidden="true">
      {/* SVG Full-Bleed Honeycomb Lattice Pattern Overlay */}
      <svg className="honeycomb-grid-bg" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hex-grid-pattern" width="56" height="96" patternUnits="userSpaceOnUse">
            <path
              d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L56 80 L56 112 L28 128 L0 112 L0 80 Z"
              fill="none"
              stroke="rgba(39, 56, 105, 0.05)"
              strokeWidth="1.2"
            />
          </pattern>
          <radialGradient id="hex-grid-mask" cx="50%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="90%" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="fade-mask">
            <rect width="100%" height="100%" fill="url(#hex-grid-mask)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-grid-pattern)" mask="url(#fade-mask)" />
      </svg>

      {/* Floating Animated Hexagons across the full width */}
      <div className="hex-floaters">
        {/* Hexagon 1: Far Top Right, large slow drift */}
        <div className="hex-item hex-1">
          <svg viewBox="0 0 100 115" className="hex-svg">
            <polygon
              points="50,2 96,28 96,82 50,108 4,82 4,28"
              fill="rgba(39, 56, 105, 0.04)"
              stroke="rgba(39, 56, 105, 0.14)"
              strokeWidth="1.5"
            />
            <polygon
              points="50,22 80,39 80,71 50,88 20,71 20,39"
              fill="none"
              stroke="rgba(39, 56, 105, 0.08)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          </svg>
        </div>

        {/* Hexagon 2: Far Top Left, amber accent */}
        <div className="hex-item hex-2">
          <svg viewBox="0 0 100 115" className="hex-svg">
            <polygon
              points="50,2 96,28 96,82 50,108 4,82 4,28"
              fill="rgba(217, 119, 6, 0.035)"
              stroke="rgba(217, 119, 6, 0.2)"
              strokeWidth="1.6"
            />
            <circle cx="50" cy="55" r="5" fill="rgba(217, 119, 6, 0.3)" />
          </svg>
        </div>

        {/* Hexagon 3: Upper Center Right */}
        <div className="hex-item hex-3">
          <svg viewBox="0 0 100 115" className="hex-svg">
            <polygon
              points="50,2 96,28 96,82 50,108 4,82 4,28"
              fill="rgba(39, 56, 105, 0.05)"
              stroke="rgba(39, 56, 105, 0.16)"
              strokeWidth="1.8"
            />
          </svg>
        </div>

        {/* Hexagon 4: Lower Left */}
        <div className="hex-item hex-4">
          <svg viewBox="0 0 100 115" className="hex-svg">
            <polygon
              points="50,2 96,28 96,82 50,108 4,82 4,28"
              fill="rgba(39, 56, 105, 0.03)"
              stroke="rgba(39, 56, 105, 0.12)"
              strokeWidth="1.2"
            />
          </svg>
        </div>

        {/* Hexagon 5: Far Right Edge (Full Viewport bleed) */}
        <div className="hex-item hex-5">
          <svg viewBox="0 0 100 115" className="hex-svg">
            <polygon
              points="50,2 96,28 96,82 50,108 4,82 4,28"
              fill="none"
              stroke="rgba(39, 56, 105, 0.15)"
              strokeWidth="2"
            />
            <polygon
              points="50,16 84,35 84,75 50,94 16,75 16,35"
              fill="rgba(39, 56, 105, 0.045)"
              stroke="rgba(39, 56, 105, 0.08)"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Hexagon 6: Honeycomb 3-cluster */}
        <div className="hex-item hex-6">
          <svg viewBox="0 0 160 180" className="hex-svg">
            <g transform="translate(40, 20)">
              <polygon
                points="40,2 76,22 76,64 40,84 4,64 4,22"
                fill="rgba(39, 56, 105, 0.035)"
                stroke="rgba(39, 56, 105, 0.14)"
                strokeWidth="1.2"
              />
            </g>
            <g transform="translate(76, 82)">
              <polygon
                points="40,2 76,22 76,64 40,84 4,64 4,22"
                fill="rgba(39, 56, 105, 0.03)"
                stroke="rgba(39, 56, 105, 0.12)"
                strokeWidth="1.2"
              />
            </g>
            <g transform="translate(4, 82)">
              <polygon
                points="40,2 76,22 76,64 40,84 4,64 4,22"
                fill="rgba(217, 119, 6, 0.03)"
                stroke="rgba(217, 119, 6, 0.14)"
                strokeWidth="1.2"
              />
            </g>
          </svg>
        </div>

        {/* Hexagon 7: Far Left Edge (Full Viewport bleed) */}
        <div className="hex-item hex-7">
          <svg viewBox="0 0 100 115" className="hex-svg">
            <polygon
              points="50,2 96,28 96,82 50,108 4,82 4,28"
              fill="rgba(39, 56, 105, 0.03)"
              stroke="rgba(39, 56, 105, 0.14)"
              strokeWidth="1.8"
            />
            <polygon
              points="50,22 80,39 80,71 50,88 20,71 20,39"
              fill="rgba(16, 185, 129, 0.025)"
              stroke="rgba(16, 185, 129, 0.15)"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Hexagon 8: Lower Right Corner */}
        <div className="hex-item hex-8">
          <svg viewBox="0 0 100 115" className="hex-svg">
            <polygon
              points="50,2 96,28 96,82 50,108 4,82 4,28"
              fill="rgba(217, 119, 6, 0.025)"
              stroke="rgba(217, 119, 6, 0.15)"
              strokeWidth="1.4"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
