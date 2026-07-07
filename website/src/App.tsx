import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Home } from "./pages/Home";
import { Legal } from "./pages/Legal";
import { Skill } from "./pages/Skill";
import { Unlock } from "./pages/Unlock";

function ScrollToTop() {
  const { pathname } = useLocation();
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is a re-run trigger only, not read in the effect body
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <div className="grain">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/skill" element={<Skill />} />
        <Route path="/unlock" element={<Unlock />} />
        <Route path="/terms" element={<Legal doc="terms" />} />
        <Route path="/privacy" element={<Legal doc="privacy" />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Analytics />
    </div>
  );
}
