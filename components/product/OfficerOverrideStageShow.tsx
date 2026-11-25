'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, MousePointer2, Pause, Play, RotateCcw, ShieldCheck } from 'lucide-react';

type Beat = 0 | 1 | 2 | 3;

const CANDIDATES = [
  { rank: '#1', name: 'Priya Nair', roll: '21CS002', score: 94, status: 'ELIGIBLE', flagged: false },
  { rank: '#2', name: 'Arjun Sharma', roll: '21CS001', score: 82, status: 'ELIGIBLE', flagged: false },
  { rank: '#3', name: 'Vikram Reddy', roll: '21CS005', score: 64, status: 'REVIEW_REQUIRED', flagged: true },
] as const;

const BEAT_TEXT = [
  '1. Ranked matrix flags Vikram Reddy (confidence < 60%)',
  '2. Officer clicks Inspect to open evaluation & reason form',
  '3. Recording override: decision = "shortlist" with written reason',
  '4. Append-only AuditEvent logged · 64% evaluation preserved',
] as const;

/**
 * OfficerOverrideStageShow — StageShow walkthrough for the Placement Officer
 * Candidate Ranking → Flagged Inspection → Audited ReviewOverride workflow.
 */
export function OfficerOverrideStageShow() {
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState<Beat>(reduced ? 3 : 0);
  const [playing, setPlaying] = useState(!reduced);

  useEffect(() => {
    if (reduced || !playing) return;
    const durations = [1600, 1500, 2000, 3000];
    const t = setTimeout(() => {
      setBeat((b) => ((b + 1) % 4) as Beat);
    }, durations[beat]);
    return () => clearTimeout(t);
  }, [beat, playing, reduced]);

  const showInspector = beat >= 2;
  const overrideSaved = beat >= 3;

  const cursorPos =
    beat === 0
      ? { x: 220, y: 120 }
      : beat === 1
      ? { x: 365, y: 232 }
      : beat === 2
      ? { x: 545, y: 272 }
      : { x: 560, y: 95 };

  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-canvas-subtle p-4 sm:p-8 shadow-sm">
        <div className="relative z-10 mx-auto max-w-[680px] rounded-xl border border-border bg-surface shadow-xl overflow-hidden">
          {/* Chrome */}
          <div className="flex items-center justify-between border-b border-border-subtle bg-surface-raised px-4 py-2.5">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
            </div>
            <div className="rounded-md bg-canvas-subtle px-3 py-0.5 text-[11px] font-mono text-text-muted border border-border-subtle">
              peersphere.app/placement/candidates
            </div>
            <div className="h-2 w-10 rounded-full bg-border-subtle" aria-hidden="true" />
          </div>

          {/* Ranking Matrix */}
          <div className="p-4 sm:p-5 space-y-3 min-h-[270px]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-accent-dark">
                  Placement Governance
                </div>
                <h4 className="text-sm sm:text-base font-bold text-text">
                  Candidate Ranking — SDE Drive
                </h4>
              </div>
              <span className="rounded-full bg-warning-light text-warning px-2.5 py-0.5 text-[10px] font-semibold">
                1 Review Required
              </span>
            </div>

            <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-canvas-subtle/40 overflow-hidden">
              {CANDIDATES.map((c) => (
                <div
                  key={c.roll}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs ${
                    c.flagged && beat === 1 ? 'bg-accent-light/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-surface border border-border-subtle flex items-center justify-center font-bold text-[11px] text-text-muted shrink-0">
                      {c.rank}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-text truncate">{c.name}</div>
                      <div className="text-[10px] text-text-faint">{c.roll}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-bold tabular text-text">{c.score}%</span>
                    {c.flagged ? (
                      overrideSaved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-light text-success px-2 py-0.5 text-[10px] font-semibold">
                          <CheckCircle2 size={10} />
                          Overridden
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning-light text-warning px-2 py-0.5 text-[10px] font-semibold">
                          <AlertTriangle size={10} />
                          Review
                        </span>
                      )
                    ) : (
                      <span className="rounded-full bg-success-light text-success px-2 py-0.5 text-[10px] font-semibold">
                        Eligible
                      </span>
                    )}
                    <span
                      className={`rounded-md px-2 py-1 text-[10px] font-semibold border ${
                        c.flagged && beat === 1
                          ? 'bg-accent text-white border-accent'
                          : 'bg-surface text-text border-border-subtle'
                      }`}
                    >
                      Inspect
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Satellite Override Drawer */}
          <motion.div
            initial={false}
            animate={{
              opacity: showInspector ? 1 : 0,
              y: showInspector ? 0 : 18,
              scale: showInspector ? 1 : 0.96,
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="sm:absolute sm:bottom-3 sm:right-3 m-3 sm:m-0 sm:w-72 rounded-xl bg-[#122038] text-white p-3.5 border border-white/15 shadow-2xl pointer-events-none"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#ffbd59]">
                ReviewOverride · Vikram Reddy
              </span>
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            </div>
            <div className="mt-2 rounded-lg bg-white/10 p-2 text-[11px] text-slate-200 leading-snug">
              <span className="text-slate-400">Reason:</span> “Strong hackathon portfolio &amp; verified backend project.”
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[10px]">
              <span className="text-slate-300">Score 64% immutable</span>
              <span
                className={`rounded-md px-2.5 py-1 font-semibold ${
                  overrideSaved ? 'bg-emerald-500 text-slate-950' : 'bg-accent text-white'
                }`}
              >
                {overrideSaved ? '✓ AuditEvent Logged' : 'Record Shortlist Override'}
              </span>
            </div>
          </motion.div>

          {/* Animated Cursor */}
          {!reduced && (
            <motion.div
              aria-hidden="true"
              animate={{
                x: cursorPos.x,
                y: cursorPos.y,
                scale: beat === 1 || beat === 2 ? 0.85 : 1,
              }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="hidden sm:block pointer-events-none absolute top-0 left-0 z-30 drop-shadow-md"
            >
              <MousePointer2 size={20} className="fill-[#122038] text-white" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-1">
        <span className="text-xs font-medium text-text-muted">{BEAT_TEXT[beat]}</span>
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
