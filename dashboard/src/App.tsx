import { useState } from "react";
import type { ModuleKey } from "@shared/types";
import { Shell } from "./components/Shell";
import { Overview } from "./modules/overview/Overview";
import { HookVault } from "./modules/hooks/HookVault";
import { Analytics } from "./modules/analytics/Analytics";
import { Competitors } from "./modules/competitors/Competitors";
import { Scheduler } from "./modules/scheduler/Scheduler";
import { CalendarView } from "./modules/calendar/Calendar";
import { Trending } from "./modules/trending/Trending";

const VIEWS: Record<ModuleKey, React.ComponentType> = {
  overview: Overview, hooks: HookVault, analytics: Analytics, competitors: Competitors,
  scheduler: Scheduler, calendar: CalendarView, trending: Trending,
};

export default function App() {
  const [active, setActive] = useState<ModuleKey>("overview");
  const View = VIEWS[active];
  return (
    <Shell active={active} onNav={setActive}>
      <View key={active} />
    </Shell>
  );
}
