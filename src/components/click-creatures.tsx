// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Red Hat, Inc.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Creature SVG definitions                                          */
/* ------------------------------------------------------------------ */

function Dino() {
  return (
    <svg viewBox="0 0 80 80" width="60" height="60">
      {/* body */}
      <ellipse cx="40" cy="48" rx="26" ry="24" fill="#7ecf8b" />
      {/* belly */}
      <ellipse cx="40" cy="54" rx="16" ry="14" fill="#b8f0c2" />
      {/* head bumps */}
      <circle cx="28" cy="24" r="6" fill="#7ecf8b" />
      <circle cx="40" cy="20" r="7" fill="#7ecf8b" />
      <circle cx="52" cy="24" r="6" fill="#7ecf8b" />
      {/* eyes */}
      <circle cx="33" cy="40" r="4" fill="white" />
      <circle cx="47" cy="40" r="4" fill="white" />
      <circle cx="34" cy="41" r="2" fill="#333" />
      <circle cx="48" cy="41" r="2" fill="#333" />
      {/* smile */}
      <path
        d="M34 52 Q40 58 46 52"
        stroke="#555"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* blush */}
      <ellipse cx="27" cy="48" rx="4" ry="2.5" fill="#f5b0b0" opacity="0.5" />
      <ellipse cx="53" cy="48" rx="4" ry="2.5" fill="#f5b0b0" opacity="0.5" />
    </svg>
  );
}

function Ghost() {
  return (
    <svg viewBox="0 0 80 90" width="60" height="68">
      {/* body */}
      <path
        d="M16 45 Q16 14 40 14 Q64 14 64 45 L64 72 Q58 64 52 72 Q46 80 40 72 Q34 80 28 72 Q22 64 16 72 Z"
        fill="#c9a0dc"
      />
      {/* eyes */}
      <circle cx="32" cy="40" r="5" fill="white" />
      <circle cx="48" cy="40" r="5" fill="white" />
      <circle cx="33" cy="41" r="2.5" fill="#333" />
      <circle cx="49" cy="41" r="2.5" fill="#333" />
      {/* smile */}
      <path
        d="M34 52 Q40 58 46 52"
        stroke="#555"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* blush */}
      <ellipse cx="26" cy="48" rx="4" ry="2.5" fill="#f5b0b0" opacity="0.5" />
      <ellipse cx="54" cy="48" rx="4" ry="2.5" fill="#f5b0b0" opacity="0.5" />
    </svg>
  );
}

function Starfish() {
  return (
    <svg viewBox="0 0 80 80" width="60" height="60">
      {/* star body */}
      <polygon
        points="40,8 47,30 70,30 52,44 58,66 40,54 22,66 28,44 10,30 33,30"
        fill="#b0b8c0"
      />
      {/* inner star */}
      <polygon
        points="40,18 44,32 58,32 47,41 51,55 40,48 29,55 33,41 22,32 36,32"
        fill="#d0d6dc"
      />
      {/* eyes */}
      <circle cx="35" cy="36" r="3" fill="white" />
      <circle cx="45" cy="36" r="3" fill="white" />
      <circle cx="35.5" cy="37" r="1.5" fill="#333" />
      <circle cx="45.5" cy="37" r="1.5" fill="#333" />
      {/* smile */}
      <path
        d="M37 43 Q40 47 43 43"
        stroke="#555"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Octopus() {
  return (
    <svg viewBox="0 0 80 85" width="60" height="64">
      {/* head */}
      <ellipse cx="40" cy="32" rx="24" ry="22" fill="#f07070" />
      {/* tentacles */}
      <path
        d="M18 48 Q14 68 20 72"
        stroke="#f07070"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M28 52 Q22 72 28 76"
        stroke="#f07070"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M40 54 Q40 74 40 78"
        stroke="#f07070"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M52 52 Q58 72 52 76"
        stroke="#f07070"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M62 48 Q66 68 60 72"
        stroke="#f07070"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* eyes */}
      <circle cx="33" cy="30" r="4.5" fill="white" />
      <circle cx="47" cy="30" r="4.5" fill="white" />
      <circle cx="34" cy="31" r="2.2" fill="#333" />
      <circle cx="48" cy="31" r="2.2" fill="#333" />
      {/* smile */}
      <path
        d="M34 40 Q40 46 46 40"
        stroke="#555"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* blush */}
      <ellipse cx="27" cy="37" rx="4" ry="2.5" fill="#f5b0b0" opacity="0.5" />
      <ellipse cx="53" cy="37" rx="4" ry="2.5" fill="#f5b0b0" opacity="0.5" />
    </svg>
  );
}

const CREATURES = [Dino, Ghost, Starfish, Octopus] as const;

const HELLOS = [
  'Hello!',
  'Hi there!',
  'Hey!',
  'Howdy!',
  'Hiya!',
  "What's up!",
  'Yo!',
  'Greetings!',
];

/* ------------------------------------------------------------------ */
/*  Creature instance rendered at a click position (container-local)  */
/* ------------------------------------------------------------------ */

interface Spawn {
  id: number;
  x: number;
  y: number;
  creatureIdx: number;
  greeting: string;
}

function CreaturePopup({
  spawn,
  onDone,
}: {
  spawn: Spawn;
  onDone: () => void;
}) {
  const Creature = CREATURES[spawn.creatureIdx];

  useEffect(() => {
    const timer = setTimeout(onDone, 2400);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: spawn.x,
        top: spawn.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* creature */}
      <div className="creature-pop">
        <Creature />
      </div>
      {/* speech bubble – positioned above the creature */}
      <div
        className="creature-bubble absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-full
          bg-white px-3 py-1 text-sm font-bold text-gray-800 shadow-lg dark:bg-gray-800 dark:text-gray-100"
      >
        {spawn.greeting}
        {/* bubble tail */}
        <div
          className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent
            border-t-white dark:border-t-gray-800"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main container component                                          */
/* ------------------------------------------------------------------ */

let nextId = 0;

export function ClickCreatures() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [spawns, setSpawns] = useState<Spawn[]>([]);
  const [enabled, setEnabled] = useState(false);
  // Track which creature types have already appeared (resets on page refresh)
  const usedCreaturesRef = useRef<Set<number>>(new Set());

  // Check server config once on mount
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          if (data.creaturesEnabled) setEnabled(true);
        }
      } catch {
        // ignore
      }
    };
    const t = setTimeout(check, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const wrapper = wrapperRef.current;
    // Listen on the parent Card (the nearest `relative` ancestor)
    const card = wrapper?.parentElement;
    if (!card) return;

    const handleClick = (e: MouseEvent) => {
      // all 4 creatures already shown — stop spawning
      if (usedCreaturesRef.current.size >= CREATURES.length) return;

      // skip interactive elements so buttons/inputs still work normally
      const target = e.target as HTMLElement;
      if (
        target.closest(
          'button, a, input, select, textarea, [role="button"], [data-no-creature]'
        )
      ) {
        return;
      }

      // pick a creature that hasn't been used yet
      const available = Array.from(
        { length: CREATURES.length },
        (_, i) => i
      ).filter((i) => !usedCreaturesRef.current.has(i));
      if (available.length === 0) return;

      const creatureIdx =
        available[Math.floor(Math.random() * available.length)];
      usedCreaturesRef.current.add(creatureIdx);

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const spawn: Spawn = {
        id: nextId++,
        x,
        y,
        creatureIdx,
        greeting: HELLOS[Math.floor(Math.random() * HELLOS.length)],
      };
      setSpawns((prev) => [...prev, spawn]);
    };

    card.addEventListener('click', handleClick);
    return () => card.removeEventListener('click', handleClick);
  }, [enabled]);

  const remove = useCallback((id: number) => {
    setSpawns((prev) => prev.filter((s) => s.id !== id));
  }, []);

  if (!enabled) return <div ref={wrapperRef} className="contents" />;

  return (
    <div ref={wrapperRef} className="contents">
      {/* inject keyframe animations */}
      <style>{`
        @keyframes creature-pop-in {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          80% { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes creature-fade-out {
          0% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.5) translateY(-20px); }
        }
        @keyframes bubble-appear {
          0% { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.5); }
          50% { opacity: 1; transform: translateX(-50%) translateY(-2px) scale(1.05); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        .creature-pop {
          animation: creature-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     creature-fade-out 0.5s ease-in 1.9s forwards;
        }
        .creature-bubble {
          animation: bubble-appear 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both,
                     creature-fade-out 0.5s ease-in 1.9s forwards;
        }
      `}</style>

      {/* Creatures render absolutely within the Card */}
      {spawns.map((spawn) => (
        <CreaturePopup
          key={spawn.id}
          spawn={spawn}
          onDone={() => remove(spawn.id)}
        />
      ))}
    </div>
  );
}
