import { useEffect, useRef } from "react";

export function useAutoScroll(messageCount: number, isGenerating: boolean) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messageCount, isGenerating]);

  return scrollRef;
}
