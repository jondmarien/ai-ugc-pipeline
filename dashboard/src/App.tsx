import type { ModuleKey } from "@shared/types";
import { useState } from "react";
import { Shell } from "./components/Shell";
import { Analytics } from "./modules/analytics/Analytics";
import { CalendarView } from "./modules/calendar/Calendar";
import { Comments } from "./modules/comments/Comments";
import { Competitors } from "./modules/competitors/Competitors";
import { HookVault } from "./modules/hooks/HookVault";
import { Meta } from "./modules/meta/Meta";
import { Overview } from "./modules/overview/Overview";
import { Scheduler } from "./modules/scheduler/Scheduler";
import { Trending } from "./modules/trending/Trending";

const VIEWS: Record<ModuleKey, React.ComponentType> = {
  overview: Overview,
  hooks: HookVault,
  analytics: Analytics,
  competitors: Competitors,
  scheduler: Scheduler,
  calendar: CalendarView,
  trending: Trending,
  meta: Meta,
  comments: Comments,
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
