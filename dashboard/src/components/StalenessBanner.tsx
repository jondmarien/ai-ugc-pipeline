import { ageLabel } from "../lib/api";
export function StalenessBanner({ label, error, fetchedAt }: { label: string; error: string | null; fetchedAt: number | null }) {
  if (!error) return null;
  return <div className="staleness">{label} · {ageLabel(fetchedAt)} · {error}</div>;
}
