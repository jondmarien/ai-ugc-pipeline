import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/motion";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/<>#*+=-_";

/**
 * Decrypts text in: characters resolve from random glyphs to their final value,
 * left to right. Writes directly to the DOM (no per-frame React re-render) and
 * is throttled to ~30fps, so it stays cheap even alongside the WebGL hero.
 * Honors reduced motion (renders final text immediately).
 */
export function Scramble({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersReducedMotion()) {
      node.textContent = text;
      return;
    }
    let raf = 0;
    let timer = 0;
    let frame = 0;
    let last = 0;
    const total = text.length;
    const tick = (t: number) => {
      if (t - last < 33) {
        raf = requestAnimationFrame(tick);
        return;
      }
      last = t;
      frame++;
      const revealed = Math.floor(frame / 1.3);
      let s = "";
      for (let i = 0; i < total; i++) {
        if (text[i] === " ") s += " ";
        else if (i < revealed) s += text[i];
        else s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      node.textContent = s;
      if (revealed <= total) raf = requestAnimationFrame(tick);
      else node.textContent = text;
    };
    timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [text, delay]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden ref={ref}>
        {prefersReducedMotion() ? text : ""}
      </span>
    </span>
  );
}
