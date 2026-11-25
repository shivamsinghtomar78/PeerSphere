'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, MousePointer2, Pause, Play, Sparkles } from 'lucide-react';
import { EligibilityBadge } from '@/components/ui/GlassBadge';

type Beat = 0 | 1 | 2 | 3 | 4;

const HERO_SKILLS = [
  { name: 'Java & Spring Boot', weight: 30, base: 'strong' },
  { name: 'PostgreSQL', weight: 25, base: 'strong' },
  { name: 'REST APIs', weight: 20, base: 'partial' },
  { name: 'Docker', weight: 25, base: 'missing' },
] as const;

/**
 * HeroStageShow — `hero-demo` style StageShow for the landing page Hero.
 * Features a cropped PeerSphere evaluation window, animated cursor, and
 * a straddling satellite roadmap card with Play/Pause & reduced-motion support.
 */
export function HeroStageShow() {
  const reduced = useReducedMotion();
  const [perspective, setPerspective] = useState<'student' | 'officer'>('student');
  const [beat, setBeat] = useState<Beat>(reduced ? 4 : 0);
  const [playing, setPlaying] = useState(!reduced);

  useEffect(() => {
    if (reduced || !playing) return;
    const durations = [1400, 1300, 2000, 1600, 3000];
    const timer = setTimeout(() => {
      setBeat((prev) => ((prev + 1) % 5) as Beat);
    }, durations[beat]);
    return () => clearTimeout(timer);
  }, [beat, playing, reduced]);

  const showSatellite = beat >= 2;
  const isVerified = beat >= 3;
  const score = isVerified ? 87 : 75;

  const cursorPos =
    beat === 0
      ? { x: 130, y: 120 }
      : beat === 1
      ? { x: 295, y: 242 }
      : beat === 2
      ? { x: 430, y: 315 }
      : beat === 3
      ? { x: 430, y: 315 }
      : { x: 455, y: 92 };

  return (
    <div className="relative pb-6 sm:pr-4">
      {/* Main Cropped Window */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
        {/* Window Chrome */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-raised px-4 py-2.5">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          </div>

          {/* Perspective Switcher */}
          <div className="inline-flex rounded-lg bg-canvas-subtle p-0.5 border border-border-subtle" role="tablist" aria-label="Hero preview perspective">
            <button
              type="button"
              role="tab"
              aria-selected={perspective === 'student'}
              onClick={() => setPerspective('student')}
              className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition-base ${
                perspective === 'student' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              Student View
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={perspective === 'officer'}
              onClick={() => setPerspective('officer')}
              className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition-base ${
                perspective === 'officer' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              Officer View
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause hero walkthrough' : 'Play hero walkthrough'}
            className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-canvas-subtle px-2 py-0.5 text-[10px] font-medium text-text-muted hover:text-text transition-base"
          >
            {playing ? <Pause size={10} /> : <Play size={10} />}
            {playing ? 'Live' : 'Paused'}
          </button>
        </div>

        {/* Window Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <EligibilityBadge status="eligible" />
                <span className="text-[11px] font-mono text-text-faint">v2.1.0</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text mt-2">
                {perspective === 'student'
                  ? 'SDE — InnovateTech Solutions'
                  : 'Arjun Sharma · Rank #1'}
              </h3>
              <p className="text-xs text-text-muted">
                {perspective === 'student'
                  ? 'CGPA 8.42 ≥ 7.50 • 0 Backlogs • CSE'
                  : '21CS001 • Snapshot SHA-256 Verified'}
              </p>
            </div>

            <motion.div
              key={score}
              initial={reduced ? false : { scale: 0.94 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`rounded-xl px-3.5 py-2 text-right border shrink-0 ${
                isVerified
                  ? 'bg-success-light border-success/30 text-success'
                  : 'bg-accent-light border-accent/30 text-accent-dark'
              }`}
            >
              <div className="text-2xl font-bold tabular leading-none">{score}%</div>
              <div className="text-[10px] font-medium mt-1">
                {isVerified ? 'Confidence 91%' : 'Confidence 84%'}
              </div>
            </motion.div>
          </div>

          {/* Skill Decomposition */}
          <div className="space-y-1.5 rounded-xl border border-border-subtle bg-canvas-subtle/60 p-3">
            {HERO_SKILLS.map((sk) => {
              const isDocker = sk.name === 'Docker';
              const status = isDocker && isVerified ? 'strong' : sk.base;
              const chipClass =
                status === 'strong'
                  ? 'bg-success-light text-success'
                  : status === 'partial'
                  ? 'bg-warning-light text-warning'
                  : 'bg-danger-light text-danger';
              const label =
                status === 'strong' ? 'Strong' : status === 'partial' ? 'Partial' : 'Missing';

              return (
                <div
                  key={sk.name}
                  className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg ${
                    isDocker && beat === 1 ? 'bg-surface ring-2 ring-accent/40' : ''
                  }`}
                >
                  <span className="font-medium text-text">
                    {sk.name}{' '}
                    <span className="text-text-faint font-normal">· {sk.weight}%</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${chipClass}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Eligibility Rule Row */}
          <div className="flex items-center justify-between gap-2 text-xs text-text-muted pt-1">
            <span className="inline-flex items-center gap-1.5">
              <Check size={13} className="text-success" />
              All 4 hard eligibility rules passed
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-dark">
              <Sparkles size={12} />
              {beat === 1 ? 'Opening Roadmap…' : 'Traceable'}
            </span>
          </div>
        </div>

        {/* Animated Cursor inside Hero Window */}
        {!reduced && playing && (
          <motion.div
            aria-hidden="true"
            animate={{
              x: cursorPos.x,
              y: cursorPos.y,
              scale: beat === 1 || beat === 3 ? 0.85 : 1,
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="hidden sm:block pointer-events-none absolute top-0 left-0 z-20 drop-shadow-md"
          >
            <MousePointer2 size={18} className="fill-[#122038] text-white" />
          </motion.div>
        )}
      </div>

      {/* Satellite Card straddling bottom-right edge */}
      <motion.div
        initial={false}
        animate={{
          opacity: showSatellite ? 1 : 0,
          y: showSatellite ? 0 : 16,
          scale: showSatellite ? 1 : 0.96,
        }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 sm:mt-0 sm:absolute sm:bottom-0 sm:right-0 sm:w-64 rounded-xl bg-[#122038] text-white p-4 border border-white/15 shadow-2xl z-30"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#ffbd59]">
            Skill-Gap Satellite
          </span>
          <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
            +12 pts lift
          </span>
        </div>
        <div className="text-xs font-semibold mt-1.5">
          {perspective === 'student'
            ? 'Docker · 3-Week Roadmap'
            : 'Override Ready · Audit Logged'}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
          <span>{isVerified ? 'Evidence verified' : '2 steps remaining'}</span>
          <span className={isVerified ? 'text-emerald-400 font-semibold' : 'text-[#ffbd59]'}>
            {isVerified ? '87% Match ✓' : '75% → 87%'}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
