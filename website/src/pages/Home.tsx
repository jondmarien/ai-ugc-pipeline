import { useRef } from "react";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { Hero } from "../sections/Hero";
import { Thesis } from "../sections/Thesis";
import { Pillars } from "../sections/Pillars";
import { Pipeline } from "../sections/Pipeline";
import { Story } from "../sections/Story";
import { CTA } from "../sections/CTA";
import { useReveal } from "../lib/motion";

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
