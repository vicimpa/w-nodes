import { collectMediaRefs, formatSize, hashBytes, mediaRef, parseMediaRef } from "./refs";
import { describe, expect, it } from "vitest";

describe('media refs', () => {
  it('round-trip a hash through a ref', () => {
    expect(parseMediaRef(mediaRef('abc'))).toBe('abc');
    expect(parseMediaRef('builtin:kick')).toBeNull();
    expect(parseMediaRef(42)).toBeNull();
  });

  it('collects refs anywhere inside configs', () => {
    const configs = [
      { x: 0, y: 0, media: mediaRef('a') },
      { pads: ['', mediaRef('b'), mediaRef('a')] },
      { nested: { deep: [mediaRef('c')] } },
      new Map([['m', mediaRef('d')]]),
      { text: 'local' },
    ];

    expect([...collectMediaRefs(configs)].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('hashes content with SHA-256', async () => {
    const bytes = new TextEncoder().encode('abc').buffer as ArrayBuffer;
    expect(await hashBytes(bytes)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('formats sizes', () => {
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(2048)).toBe('2.0 KB');
    expect(formatSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});
