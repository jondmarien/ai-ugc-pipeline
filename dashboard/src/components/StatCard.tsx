import { Panel } from "./Panel";
export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Panel className="stat-card">
      <div className="meta-caps">{label}</div>
      <div className="num">{value}</div>
      {sub ? <div className="meta-caps">{sub}</div> : null}
    </Panel>
  );
}
