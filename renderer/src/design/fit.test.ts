import { test, expect } from "bun:test";
import { computeFitScale } from "./fit";

test("fits already → scale 1", () => { expect(computeFitScale(600, 800, 0.5)).toBe(1); });
test("overflow → proportional shrink", () => { expect(computeFitScale(1000, 800, 0.5)).toBeCloseTo(0.8); });
test("never below floor", () => { expect(computeFitScale(4000, 800, 0.5)).toBe(0.5); });
test("guards zero/neg", () => { expect(computeFitScale(0, 800, 0.5)).toBe(1); });
