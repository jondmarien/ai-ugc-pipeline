import { BarChart, Bar, Tooltip, ResponsiveContainer } from "recharts";

// Minimal accent bar chart (recharts under the hood, chron0s-themed: no axes, no grid,
// accent fill from the active module theme, dark tooltip). Same interface as before so
// callers pass { values, labels?, height }.
export function Bars({ values, labels, height = 96 }: { values: number[]; labels?: string[]; height?: number }) {
  const data = values.map((v, i) => ({ v, label: labels?.[i] ?? String(i + 1) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Tooltip
          cursor={{ fill: "rgba(148,163,184,0.08)" }}
          contentStyle={{
            background: "var(--bg-deep)", border: "1px solid var(--hairline)",
            borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 11,
          }}
          labelStyle={{ display: "none" }}
          formatter={(value: number, _n, p: any) => [p?.payload?.label ?? value, ""]}
          separator=""
        />
        <Bar dataKey="v" fill="var(--accent)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
