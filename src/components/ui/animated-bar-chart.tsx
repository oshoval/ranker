// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBarChartProps {
  className?: string;
}

// Bar configuration: x position, resting height (matching BarChart2 proportions)
const BARS = [
  { x: 4.5, height: 6, delay: '0s' },
  { x: 10.5, height: 16, delay: '0.12s' },
  { x: 16.5, height: 10, delay: '0.24s' },
] as const;

const BAR_WIDTH = 3;
const BASELINE_Y = 20;

/**
 * Animated BarChart2-style icon.
 * Bars animate their heights on initial mount and on hover.
 */
export function AnimatedBarChart({ className }: AnimatedBarChartProps) {
  const [animating, setAnimating] = useState(true); // start animated on mount
  const [hovered, setHovered] = useState(false);
  const endCountRef = useRef(0);

  // Reset animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hovered) setAnimating(false);
    }, 1400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseEnter = () => {
    setHovered(true);
    setAnimating(true);
    endCountRef.current = 0;
  };

  const handleMouseLeave = () => {
    setHovered(false);
    // Let current animation cycle finish naturally
  };

  const handleAnimationEnd = () => {
    endCountRef.current += 1;
    // All 3 bars finished
    if (endCountRef.current >= BARS.length) {
      if (hovered) {
        // Restart for continuous hover animation
        endCountRef.current = 0;
        setAnimating(false);
        requestAnimationFrame(() => setAnimating(true));
      } else {
        setAnimating(false);
      }
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('bar-chart-icon', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Baseline */}
      <line x1="2" y1={BASELINE_Y} x2="22" y2={BASELINE_Y} />

      {/* Animated bars */}
      {BARS.map((bar, i) => {
        const restY = BASELINE_Y - bar.height;
        return (
          <rect
            key={i}
            x={bar.x}
            y={restY}
            width={BAR_WIDTH}
            height={bar.height}
            rx="1"
            fill="currentColor"
            stroke="none"
            className={cn(
              'bar-chart-bar',
              animating && 'bar-chart-bar-animate'
            )}
            style={
              {
                '--bar-delay': bar.delay,
                transformOrigin: `${bar.x + BAR_WIDTH / 2}px ${BASELINE_Y}px`,
              } as React.CSSProperties
            }
            onAnimationEnd={handleAnimationEnd}
          />
        );
      })}
    </svg>
  );
}
