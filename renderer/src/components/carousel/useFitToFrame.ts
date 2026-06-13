import { useLayoutEffect, useRef, useState } from "react";
import { computeFitScale } from "@/design/fit";

// Measures blockRef natural height against frameRef inner height; returns a scale
// (floored at minScale) and records window.__fitDebug / increments window.__fitSettled.
export function useFitToFrame(minScale: number, deps: unknown[]) {
  const frameRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const frame = frameRef.current, block = blockRef.current;
    if (!frame || !block) return;
    const natural = block.scrollHeight;   // measured at scale 1 (block renders unscaled first)
    const avail = frame.clientHeight;
    const s = computeFitScale(natural, avail, minScale);
    setScale(s);
    const w = window as unknown as { __fitSettled?: number; __fitDebug?: unknown };
    w.__fitSettled = (w.__fitSettled ?? 0) + 1;
    w.__fitDebug = { natural, avail, scale: s, floored: s === minScale && natural > avail };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { frameRef, blockRef, scale };
}
