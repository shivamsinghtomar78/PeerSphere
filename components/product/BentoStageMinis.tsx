'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, FileText, ShieldCheck } from 'lucide-react';

/**
 * UploadStageMini — StageShow `upload` pattern inside the Verified PDF Resumes Bento card.
 * Animates a resume file dropping in, %PDF- magic-byte + SHA-256 verification, and settling as UPLOADED.
 */
export function UploadStageMini() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState<0 | 1 | 2>(reduced ? 2 : 0);

  useEffect(() => {
    if (reduced) return;
    const timings = [1200, 1500, 2600];
    const t = setTimeout(() => {
      setStep((s) => ((s + 1) % 3) as 0 | 1 | 2);
    }, timings[step]);
    return () => clearTimeout(t);
  }, [step, reduced]);

  return (
    <div className="mt-3 rounded-xl border border-border-subtle bg-canvas-subtle p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-accent-light text-accent-dark flex items-center justify-center shrink-0">
            <FileText size={14} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-text truncate">
              Arjun_Sharma_Resume.pdf
            </div>
            <div className="text-[10px] font-mono text-text-faint">
              {step === 0 ? 'Queued · 412 KB' : step === 1 ? 'Checking %PDF- & SHA-256…' : 'state: UPLOADED · sha256:9f2a…'}
            </div>
          </div>
        </div>
        {step === 2 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-light text-success px-2 py-0.5 text-[10px] font-semibold shrink-0">
            <CheckCircle2 size={11} />
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-light text-accent-dark px-2 py-0.5 text-[10px] font-semibold shrink-0">
            <ShieldCheck size={11} />
            {step === 0 ? 'Upload' : 'Scanning'}
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div className="h-1.5 w-full rounded-full bg-border-subtle overflow-hidden">
        <motion.div
          className={step === 2 ? 'h-full bg-success' : 'h-full bg-accent'}
          initial={false}
          animate={{ width: step === 0 ? '25%' : step === 1 ? '72%' : '100%' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

const COHORT_POINTS = [
  { label: 'Week 1', readiness: 64, students: 120 },
  { label: 'Week 2', readiness: 69, students: 120 },
  { label: 'Week 3', readiness: 73, students: 120 },
  { label: 'Week 4', readiness: 78, students: 120 },
  { label: 'Week 5', readiness: 82, students: 120 },
  { label: 'Week 6', readiness: 86, students: 120 },
] as const;

/**
 * ChartScrubStageMini — StageShow `chart-scrub` pattern inside Cohort Analytics Bento card.
 * A smooth hairline & dot scrub across the readiness curve while the headline number updates live.
 * Users can also hover/tap any point directly.
 */
export function ChartScrubStageMini() {
  const reduced = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState<number>(COHORT_POINTS.length - 1);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (reduced || hovered) return;
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % COHORT_POINTS.length);
    }, 1100);
    return () => clearInterval(t);
  }, [reduced, hovered]);

  const width = 260;
  const height = 72;
  const padX = 10;
  const padY = 10;

  const coords = COHORT_POINTS.map((pt, i) => {
    const x = padX + (i / (COHORT_POINTS.length - 1)) * (width - padX * 2);
    const norm = (pt.readiness - 58) / (92 - 58);
    const y = height - padY - norm * (height - padY * 2);
    return { x, y, ...pt };
  });

  const pathD = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const active = coords[activeIdx]!;

  return (
    <div
      className="mt-3 sm:mt-0 rounded-xl border border-border-subtle bg-canvas-subtle p-3 w-full sm:w-64 shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-faint">
            Cohort Readiness · {active.label}
          </div>
          <div className="text-xl font-bold text-text tabular">{active.readiness}%</div>
        </div>
        <span className="text-[10px] font-medium text-success bg-success-light px-2 py-0.5 rounded-full">
          +{active.readiness - 64}% lift
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-16 overflow-visible cursor-crosshair"
        role="img"
        aria-label="Cohort readiness trend chart"
      >
        {/* Path */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--ps-accent)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hairline */}
        <motion.line
          initial={false}
          animate={{ x1: active.x, x2: active.x }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          y1={4}
          y2={height - 4}
          stroke="var(--ps-border-strong)"
          strokeDasharray="3 3"
          strokeWidth="1"
        />

        {/* Active Dot */}
        <motion.circle
          initial={false}
          animate={{ cx: active.x, cy: active.y }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          r="4.5"
          fill="var(--ps-accent)"
          stroke="var(--ps-surface)"
          strokeWidth="2"
        />

        {/* Interactive hit targets */}
        {coords.map((c, idx) => (
          <rect
            key={c.label}
            x={c.x - 18}
            y={0}
            width={36}
            height={height}
            fill="transparent"
            onMouseEnter={() => setActiveIdx(idx)}
          />
        ))}
      </svg>
    </div>
  );
}
