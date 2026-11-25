'use client';

import React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * PageTransition — subtle entrance for route content. Respects prefers-reduced-motion.
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 1, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer — coordinates staggered reveal of Bento cards.
 */
export function StaggerContainer({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.03,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'>) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children as React.ReactNode}</div>;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 1, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.28, ease: EASE_OUT },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScrollReveal — reveals sections cleanly on scroll into view (once).
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
