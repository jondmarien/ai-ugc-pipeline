The shared carousel/reel canvas — the frame every slide is built on. Compose the text primitives inside it.

```jsx
<div className="theme-defensive">
  <SlideShell background="/assets/backgrounds/blue/01_cover.png" current={1} total={8} align="end">
    <Kicker>AI × Cybersecurity</Kicker>
    <Headline size="cover">THE WEIRDEST AI ATTACK HIDES WHERE YOUR AGENT READS</Headline>
    <Subline>Prompt injection isn't always typed by the user.</Subline>
    <Chip>Swipe →</Chip>
  </SlideShell>
</div>
```

`align="end"` for cover/standard/cta, `align="center"` for takeaways. `format="reel"` switches to 1080×1920. Set `scale={0.4}` to fit a smaller container. Wrap in a `theme-*` class to set the accent.
