import { useRef } from "react";
import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { useReveal } from "../lib/motion";
import { CTA } from "../sections/CTA";
import { Hero } from "../sections/Hero";
import { Pillars } from "../sections/Pillars";
import { Pipeline } from "../sections/Pipeline";
import { Story } from "../sections/Story";
import { Thesis } from "../sections/Thesis";

export function Home() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  return (
    <div ref={root}>
      <Nav />
      <main>
        <Hero />
        <Thesis />
        <Pillars />
        <Pipeline />
        <Story />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
