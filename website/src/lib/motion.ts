import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Reveals every [data-reveal] descendant of `root` on scroll, with a soft
 * upward fade. Elements in the same [data-reveal-group] stagger together.
 * No-ops under prefers-reduced-motion (CSS leaves them visible).
 */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      // grouped staggers
      gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
        const items = group.querySelectorAll("[data-reveal]");
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: group, start: "top 82%", once: true },
        });
      });
      // standalone reveals (not inside a group)
      gsap.utils
        .toArray<HTMLElement>("[data-reveal]")
        .filter((el) => !el.closest("[data-reveal-group]"))
        .forEach((el) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          });
        });
    }, root);
    return () => ctx.revert();
  }, [root]);
}
