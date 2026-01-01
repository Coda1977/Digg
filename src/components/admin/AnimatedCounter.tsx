"use client";

import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

type AnimatedCounterProps = {
  /** Target value to count to */
  value: number;
  /** Duration of animation in milliseconds (default: 1000) */
  duration?: number;
  /** Delay before starting animation in milliseconds (default: 0) */
  delay?: number;
  /** CSS class name for styling */
  className?: string;
};

/**
 * Animated counter component that counts up from 0 to the target value.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */
export function AnimatedCounter({
  value,
  duration = 1000,
  delay = 0,
  className,
}: AnimatedCounterProps) {
  const count = useAnimatedCounter({ target: value, duration, delay });

  return <span className={className}>{count}</span>;
}
