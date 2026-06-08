import { Panel } from "./Panel";
export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <Panel>
      <div className="meta-caps">{title}</div>
      <p style={{ color: "var(--muted)" }}>{hint}</p>
    </Panel>
  );
}
