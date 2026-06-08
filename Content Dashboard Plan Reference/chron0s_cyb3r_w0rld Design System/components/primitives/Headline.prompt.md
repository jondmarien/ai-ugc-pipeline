The dominant display headline (Archivo 800) with inline emphasis markup for two-tone takeaways.

```jsx
<Headline size="cover">THE WEIRDEST AI ATTACK HIDES WHERE YOUR AGENT READS</Headline>
<Headline size="takeaway">Treat external content [[like user input wearing a costume]].</Headline>
<Headline>The win {{isn't "AI that thinks."}} [[It's an agent you own.]]</Headline>
```

`[[...]]` paints the theme accent, `{{...}}` paints danger red. Casing is authored in the string — covers SHOUT in caps, takeaways are sentence-case. Sizes: `cover` (104px), `takeaway` (96px), `headline` (76px, default), or a px number.
