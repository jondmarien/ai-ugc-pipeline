export type ScheduleStatus = "queued" | "posted" | "skipped";
export type ScheduleItem = {
  id: string; renderDir: string; date: string; time: string;
  platforms: string[]; status: ScheduleStatus; postedAt?: string;
};

const LEGAL: Record<ScheduleStatus, ScheduleStatus[]> = {
  queued: ["posted", "skipped"],
  posted: [],
  skipped: [],
};

export function transition(item: ScheduleItem, to: ScheduleStatus): ScheduleItem {
  if (!LEGAL[item.status].includes(to)) {
    throw new Error(`illegal transition: ${item.status} -> ${to}`);
  }
  return { ...item, status: to, ...(to === "posted" ? { postedAt: new Date().toISOString() } : {}) };
}
