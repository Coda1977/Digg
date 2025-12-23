import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook for copy-to-clipboard functionality with visual feedback.
 * Returns the current copied state and a function to trigger the copy.
 * The copied state automatically resets after a delay.
 */
export function useCopyFeedback(resetDelay = 1500) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCopy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Reset after delay
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, resetDelay);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },
    [resetDelay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copied, onCopy };
}
