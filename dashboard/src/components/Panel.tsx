export function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`panel ${className}`}>{children}</section>;
}
