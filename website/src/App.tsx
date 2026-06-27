import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { Home } from "./pages/Home";
import { Legal } from "./pages/Legal";

function ScrollToTop() {
  const { pathname } = useLocation();
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
        <Route path="/terms" element={<Legal doc="terms" />} />
        <Route path="/privacy" element={<Legal doc="privacy" />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Analytics />
    </div>
  );
}
