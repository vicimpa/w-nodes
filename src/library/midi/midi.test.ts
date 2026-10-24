import { describe, expect, it } from "vitest";
import { noteName, noteToFreq, parseMessage, pitchBendValue } from "./message";

import { NoteStack } from "./noteStack";
import { findInput } from "./device";

describe('parseMessage', () => {
  it('reads note on with channel', () => {
    expect(parseMessage([0x90, 60, 100])).toEqual({ type: 'noteon', channel: 1, data: [60, 100] });
    expect(parseMessage(new Uint8Array([0x9F, 64, 1]))).toEqual({ type: 'noteon', channel: 16, data: [64, 1] });
  });

  it('treats note on with velocity 0 as note off', () => {
    expect(parseMessage([0x93, 60, 0])).toEqual({ type: 'noteoff', channel: 4, data: [60, 0] });
    expect(parseMessage([0x83, 60, 64])).toEqual({ type: 'noteoff', channel: 4, data: [60, 64] });
  });

  it('reads channel voice messages', () => {
    expect(parseMessage([0xB0, 7, 127])?.type).toBe('cc');
    expect(parseMessage([0xE1, 0, 64])).toEqual({ type: 'pitchbend', channel: 2, data: [0, 64] });
    expect(parseMessage([0xC5, 12])).toEqual({ type: 'program', channel: 6, data: [12] });
    expect(parseMessage([0xD0, 50])?.type).toBe('aftertouch');
    expect(parseMessage([0xA0, 60, 50])?.type).toBe('polytouch');
  });

  it('marks system messages', () => {
    expect(parseMessage([0xF8])).toEqual({ type: 'system', channel: 0, data: [0xF8] });
  });

  it('rejects empty and data-only messages', () => {
    expect(parseMessage(null)).toBeNull();
    expect(parseMessage([])).toBeNull();
    expect(parseMessage([60, 100])).toBeNull();
  });
});

describe('pitchBendValue', () => {
  it('maps 14 bits to -1..1', () => {
    expect(pitchBendValue(0, 64)).toBe(0);
    expect(pitchBendValue(0, 0)).toBe(-1);
    expect(pitchBendValue(127, 127)).toBe(1);
    expect(pitchBendValue(0, 96)).toBeCloseTo(.5, 3);
  });
});

describe('notes', () => {
  it('converts note numbers to Hz', () => {
    expect(noteToFreq(69)).toBe(440);
    expect(noteToFreq(81)).toBe(880);
    expect(noteToFreq(57)).toBe(220);
    expect(noteToFreq(60)).toBeCloseTo(261.6256, 3);
  });

  it('names notes', () => {
    expect(noteName(69)).toBe('A4');
    expect(noteName(60)).toBe('C4');
    expect(noteName(61)).toBe('C#4');
    expect(noteName(0)).toBe('C-1');
    expect(noteName(127)).toBe('G9');
  });
});

describe('NoteStack', () => {
  it('plays the last pressed note', () => {
    const stack = new NoteStack();

    expect(stack.press(60, .5)).toEqual({ note: 60, velocity: .5 });
    expect(stack.press(64, 1)).toEqual({ note: 64, velocity: 1 });
    expect(stack.top?.note).toBe(64);
  });

  it('falls back to the previous held note', () => {
    const stack = new NoteStack();

    stack.press(60, .5);
    stack.press(64, .7);
    stack.press(67, 1);

    expect(stack.release(67)).toEqual({ note: 64, velocity: .7 });
    expect(stack.release(60)).toEqual({ note: 64, velocity: .7 });
    expect(stack.release(64)).toBeUndefined();
    expect(stack.size).toBe(0);
  });

  it('keeps the top when a lower note is released', () => {
    const stack = new NoteStack();

    stack.press(60, 1);
    stack.press(64, 1);

    expect(stack.release(60)?.note).toBe(64);
  });

  it('moves a repressed note to the top without duplicates', () => {
    const stack = new NoteStack();

    stack.press(60, .2);
    stack.press(64, .2);
    stack.press(60, .9);

    expect(stack.size).toBe(2);
    expect(stack.top).toEqual({ note: 60, velocity: .9 });
    expect(stack.release(60)?.note).toBe(64);
  });

  it('ignores release of a note that is not held', () => {
    const stack = new NoteStack();

    stack.press(60, 1);

    expect(stack.release(72)?.note).toBe(60);
    stack.clear();
    expect(stack.top).toBeUndefined();
  });
});

describe('findInput', () => {
  const list = [
    { id: 'a', name: 'KeyStep' },
    { id: 'b', name: 'Launch Control' },
  ];

  it('prefers the id, then falls back to the name', () => {
    expect(findInput(list, 'b', 'KeyStep')?.id).toBe('b');
    expect(findInput(list, 'x', 'KeyStep')?.id).toBe('a');
    expect(findInput(list, 'x', 'Other')).toBeUndefined();
    expect(findInput(list, 'x')).toBeUndefined();
  });
});
