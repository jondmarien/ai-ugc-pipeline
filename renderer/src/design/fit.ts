// Visual shrink-to-fit factor for a bottom/centre-aligned text block.
// contentPx = natural block height, framePx = available height, minScale = legibility floor.
export function computeFitScale(contentPx: number, framePx: number, minScale: number): number {
  if (contentPx <= 0 || framePx <= 0 || contentPx <= framePx) return 1;
  return Math.max(minScale, framePx / contentPx);
}
