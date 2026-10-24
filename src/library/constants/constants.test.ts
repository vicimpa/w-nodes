import { NUMBER, constantCode, constantValue, constants } from ".";
import { describe, expect, it } from "vitest";

describe('constants', () => {
  it('have unique ids', () => {
    expect(new Set(constants.map(item => item.id)).size).toBe(constants.length);
  });

  it('give the same value from the table and from generated code', () => {
    const sr = 48000;

    for (const item of constants) {
      const code = constantCode(item.id, 0)!;
      const fromCode = new Function('sr', `return ${code};`)(sr);
      expect(fromCode).toBeCloseTo(constantValue(item.id, 0, sr)!, 12);
    }
  });

  it('resolve known values', () => {
    expect(constantValue('PI', 0, 44100)).toBe(Math.PI);
    expect(constantValue('PHI', 0, 44100)).toBeCloseTo(1.6180339887, 9);
    expect(constantValue('NYQUIST', 0, 44100)).toBe(22050);
    expect(constantValue(NUMBER, -2.5, 44100)).toBe(-2.5);
  });

  it('reject unknown ids and non-finite numbers', () => {
    expect(constantValue('constructor', 0, 1)).toBeNull();
    expect(constantCode('constructor', 0)).toBeNull();
    expect(constantCode(NUMBER, Infinity)).toBeNull();
    expect(constantCode(NUMBER, '1); alert(1')).toBeNull();
    expect(constantCode(NUMBER, 1e21)).toBe('(1e+21)');
  });
});
