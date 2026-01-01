"use client";

import { useEffect, useState } from "react";

type UseAnimatedCounterOptions = {
  /** Target value to count to */
  target: number;
  /** Duration of animation in milliseconds (default: 1000) */
  duration?: number;
  /** Delay before starting animation in milliseconds (default: 0) */
  delay?: number;
  /** Easing function (default: easeOutQuart for a nice deceleration) */
  easing?: (t: number) => number;
};

// Easing function: starts fast, slows down at the end
const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

/**
 * Hook that animates a number from 0 to a target value.
 * Perfect for stat counters that should animate on page load.
 */
export function useAnimatedCounter({
  target,
  duration = 1000,
  delay = 0,
  easing = easeOutQuart,
}: UseAnimatedCounterOptions): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Don't animate if target is 0
    if (target === 0) {
      setCount(0);
      return;
    }

    let animationFrameId: number;
    let startTime: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout>;

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const currentCount = Math.round(easedProgress * target);

      setCount(currentCount);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    // Start animation after delay
    timeoutId = setTimeout(() => {
      animationFrameId = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [target, duration, delay, easing]);

  return count;
}
