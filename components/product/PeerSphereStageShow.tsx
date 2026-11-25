'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, MousePointer2, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';

type Beat = 0 | 1 | 2 | 3 | 4;

const BEAT_LABELS = [
  '1. Inspecting 75% drive match (Docker missing)',
  '2. Clicking "Generate Roadmap" on missing skill',
  '3. Reviewing 3-week Docker roadmap (+12 pts)',
  '4. Verifying skill evidence & rolling score',
  '5. Match updated: 87% · Eligible & Ready',
] as const;

/**
 * PeerSphereStageShow — Stageshow-inspired miniature product walkthrough.
 * Shows a real PeerSphere evaluation window, animated cursor, satellite roadmap card,
 * and score roll-up (75% -> 87%) with reduced-motion poster fallback.
 */
export function PeerSphereStageShow() {
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState<Beat>(reduced ? 4 : 0);
  const [playing, setPlaying] = useState(!reduced);

  useEffect(() => {
    if (reduced || !playing) return;
    const durations = [1600, 1400, 2200, 1800, 3000];
    const timer = setTimeout(() => {
      setBeat((prev) => ((prev + 1) % 5) as Beat);
    }, durations[beat]);
    return () => clearTimeout(timer);
  }, [beat, playing, reduced]);

  const isRoadmapOpen = beat >= 2;
  const isVerified = beat >= 3;
  const score = isVerified ? 87 : 75;

  // Cursor coordinates inside the 680x360 stage
  const cursorPos =
    beat === 0
      ? { x: 180, y: 120 }
      : beat === 1
      ? { x: 245, y: 248 }
      : beat === 2
      ? { x: 515, y: 256 }
      : beat === 3
      ? { x: 515, y: 256 }
      : { x: 560, y: 92 };

  return (
    <div className="space-y-3">
      {/* Stage Well */}
      <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-canvas-subtle p-4 sm:p-8 shadow-sm">
        {/* Subtle dot grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage: 'radial-gradient(var(--ps-border) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Browser Window (cropped bottom-right feel) */}
        <div className="relative z-10 mx-auto max-w-[680px] rounded-xl border border-border bg-surface shadow-xl overflow-hidden">
          {/* Window Chrome */}
          <div className="flex items-center justify-between border-b border-border-subtle bg-surface-raised px-4 py-2.5">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
            </div>
            <div className="rounded-md bg-canvas-subtle px-3 py-0.5 text-[11px] font-mono text-text-muted border border-border-subtle">
              peersphere.app/student/match
            </div>
            <div className="h-2 w-10 rounded-full bg-border-subtle" aria-hidden="true" />
          </div>

          {/* Window Body */}
          <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] min-h-[270px]">
            {/* Simplified Sidebar */}
            <div className="hidden sm:flex flex-col gap-2.5 border-r border-border-subtle bg-canvas-subtle/60 p-3" aria-hidden="true">
              <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
                <div className="h-5 w-5 rounded bg-accent text-[10px] font-bold text-white flex items-center justify-center">P</div>
                <div className="h-2 w-14 rounded bg-border" />
              </div>
              <div className="h-2.5 w-16 rounded bg-border-subtle" />
              <div className="h-2.5 w-20 rounded bg-accent/25" />
              <div className="h-2.5 w-14 rounded bg-border-subtle" />
              <div className="h-2.5 w-16 rounded bg-border-subtle" />
            </div>

            {/* Main Match Pane */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-accent-dark">
                    Drive Evaluation
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-text">
                    SDE — InnovateTech Solutions
                  </h4>
                  <p className="text-[11px] text-text-muted">CGPA 8.40 ≥ 7.50 • 0 Backlogs • Eligible</p>
                </div>

                {/* Rolling Match Score */}
                <div className="flex flex-col items-end shrink-0">
                  <motion.div
                    key={score}
                    initial={reduced ? false : { scale: 0.94 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={`rounded-xl px-3 py-1.5 text-lg font-bold tabular border ${
                      isVerified
                        ? 'bg-success-light text-success border-success/30'
                        : 'bg-accent-light text-accent-dark border-accent/30'
                    }`}
                  >
                    {score}%
                  </motion.div>
                  <span className="text-[10px] text-text-faint mt-0.5">
                    {isVerified ? 'Confidence 91%' : 'Confidence 84%'}
                  </span>
                </div>
              </div>

              {/* Skill Rows */}
              <div className="space-y-1.5 rounded-lg border border-border-subtle bg-canvas-subtle/50 p-2.5">
                <div className="flex items-center justify-between text-xs py-1 px-1.5">
                  <span className="font-medium text-text">Java &amp; Spring Boot</span>
                  <span className="rounded-full bg-success-light text-success px-2 py-0.5 text-[10px] font-semibold">
                    Strong (1.0)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 px-1.5">
                  <span className="font-medium text-text">PostgreSQL</span>
                  <span className="rounded-full bg-success-light text-success px-2 py-0.5 text-[10px] font-semibold">
                    Strong (1.0)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 px-1.5 rounded-md bg-surface border border-border-subtle">
                  <span className="font-semibold text-text">Docker</span>
                  <motion.span
                    key={isVerified ? 'strong' : 'missing'}
                    initial={reduced ? false : { y: -3 }}
                    animate={{ y: 0 }}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isVerified
                        ? 'bg-success-light text-success'
                        : 'bg-danger-light text-danger'
                    }`}
                  >
                    {isVerified ? 'Strong (1.0)' : 'Missing (0.0)'}
                  </motion.span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    beat === 1
                      ? 'bg-accent text-white ring-2 ring-accent/40 scale-[0.98]'
                      : 'bg-accent text-white'
                  }`}
                >
                  <Sparkles size={12} />
                  Generate Roadmap
                </span>
                <div className="h-2.5 w-24 rounded bg-border-subtle" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Satellite Card: Skill-Gap Roadmap (straddles bottom-right inside stage) */}
          <motion.div
            initial={false}
            animate={{
              opacity: isRoadmapOpen ? 1 : 0,
              y: isRoadmapOpen ? 0 : 18,
              scale: isRoadmapOpen ? 1 : 0.96,
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="sm:absolute sm:bottom-3 sm:right-3 m-3 sm:m-0 sm:w-64 rounded-xl border border-border bg-[#122038] text-white p-3.5 shadow-2xl pointer-events-none"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#ffbd59]">
                Docker Roadmap
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                +12 pts lift
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-[11px] text-slate-200">
              <li className="flex items-center gap-1.5">
                <Check size={11} className="text-[#ffbd59] shrink-0" />
                Containerize REST API
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={11} className="text-[#ffbd59] shrink-0" />
                Multi-stage Compose + CI
              </li>
            </ul>
            <div
              className={`mt-2.5 w-full rounded-md py-1 text-center text-[11px] font-semibold ${
                isVerified
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-white/15 text-white'
              }`}
            >
              {isVerified ? '✓ Evidence Verified' : 'Verify Skill Evidence'}
            </div>
          </motion.div>

          {/* Animated Cursor (desktop) */}
          {!reduced && (
            <motion.div
              aria-hidden="true"
              animate={{
                x: cursorPos.x,
                y: cursorPos.y,
                scale: beat === 1 || beat === 3 ? 0.85 : 1,
              }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="hidden sm:block pointer-events-none absolute top-0 left-0 z-30 text-text drop-shadow-md"
            >
              <MousePointer2 size={20} className="fill-[#122038] text-white" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Stage Controls & Beat Indicator */}
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-1">
        <span className="text-xs font-medium text-text-muted">
          {BEAT_LABELS[beat]}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-surface-raised transition-base"
          >
            {playing ? <Pause size={12} /> : <Play size={12} />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => {
              setBeat(0);
              setPlaying(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-surface-raised transition-base"
          >
            <RotateCcw size={12} />
            Replay
          </button>
        </div>
      </div>
    </div>
  );
}
