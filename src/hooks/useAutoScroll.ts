import { useEffect, useRef } from "react";

export function useAutoScroll(dependencies: Array<unknown>) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, dependencies);

  return scrollRef;
}
