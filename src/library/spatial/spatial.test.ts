import { azimuth, coneGain, distanceGain, niceCeil, toDecibels } from ".";
import { describe, expect, it } from "vitest";

describe('spatial', () => {
  it('computes distance gain per model', () => {
    expect(distanceGain('inverse', 1, 1, 10000, 1)).toBe(1);
    expect(distanceGain('inverse', 2, 1, 10000, 1)).toBeCloseTo(0.5);
    expect(distanceGain('inverse', 0.5, 1, 10000, 1)).toBe(1);
    expect(distanceGain('exponential', 4, 1, 10000, 2)).toBeCloseTo(1 / 16);
    expect(distanceGain('linear', 5.5, 1, 10, 1)).toBeCloseTo(0.5);
    expect(distanceGain('linear', 50, 1, 10, 1)).toBeCloseTo(0);
    expect(distanceGain('linear', 50, 1, 10, 5)).toBeCloseTo(0);
  });

  it('computes cone gain', () => {
    // Источник в (0,0,-2) смотрит на слушателя (+Z) — внутри конуса
    expect(coneGain(60, 120, 0.2, [0, 0, 1], [0, 0, -2])).toBe(1);
    // Смотрит от слушателя — снаружи
    expect(coneGain(60, 120, 0.2, [0, 0, -1], [0, 0, -2])).toBeCloseTo(0.2);
    // Между внутренним (30°) и внешним (60°) полуконусом — 45°: половина пути
    const side = coneGain(60, 120, 0, [1, 0, 1], [0, 0, -2]);
    expect(side).toBeCloseTo(0.5);
    expect(coneGain(360, 360, 0, [1, 0, 0], [0, 0, -1])).toBe(1);
    expect(coneGain(10, 20, 0, [0, 0, 0], [0, 0, -1])).toBe(1);
  });

  it('reports azimuth for a listener facing -Z', () => {
    expect(azimuth(0, -1)).toBeCloseTo(0);
    expect(azimuth(1, 0)).toBeCloseTo(90);
    expect(azimuth(-1, 0)).toBeCloseTo(-90);
    expect(Math.abs(azimuth(0, 1))).toBeCloseTo(180);
  });

  it('rounds up to 1-2-5 steps', () => {
    expect(niceCeil(0.7)).toBe(1);
    expect(niceCeil(3)).toBe(5);
    expect(niceCeil(12)).toBe(20);
    expect(niceCeil(500)).toBe(500);
    expect(toDecibels(0.5)).toBeCloseTo(-6.02, 2);
  });
});
