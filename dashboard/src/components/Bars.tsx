export function Bars({ values, labels, height = 96 }: { values: number[]; labels?: string[]; height?: number }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
      {values.map((v, i) => (
        <div key={i} title={labels?.[i]} style={{
          flex: 1, height: `${(v / max) * 100}%`, minHeight: 2,
          background: "var(--accent)", opacity: 0.85, borderRadius: 2,
        }} />
      ))}
    </div>
  );
}
