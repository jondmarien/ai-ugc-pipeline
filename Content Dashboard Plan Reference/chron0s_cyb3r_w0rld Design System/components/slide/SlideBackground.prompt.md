The full-bleed background layer: cinematic key-art image OR procedural CSS fallback, with built-in legibility grounding.

```jsx
<SlideBackground src="/assets/backgrounds/blue/01_cover.png" accent="#3b82f6" />
<SlideBackground /> {/* procedural: accent wash + masked grid + scanlines */}
```

Usually you don't use this directly — `SlideShell` wraps it. Reach for it standalone only when building a custom canvas. Backgrounds are always text-free, logo-free.
