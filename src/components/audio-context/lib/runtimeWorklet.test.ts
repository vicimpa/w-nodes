import { describe, expect, it, vi } from "vitest";

const addModule = vi.fn(async (_url: string) => { });

vi.mock('../ctx', () => ({
  ctx: { sampleRate: 48000, audioWorklet: { addModule } },
}));

const { defineRuntimeWorklet } = await import('./runtimeWorklet');

describe('defineRuntimeWorklet', () => {
  it('registers each key once', async () => {
    addModule.mockClear();
    const build = vi.fn((name: string) => `registerProcessor(${JSON.stringify(name)}, class {})`);

    const [first, second] = await Promise.all([
      defineRuntimeWorklet('kernel-a', build),
      defineRuntimeWorklet('kernel-a', build),
    ]);
    const other = await defineRuntimeWorklet('kernel-b', build);

    expect(first).toBe(second);
    expect(other).not.toBe(first);
    expect(build).toHaveBeenCalledTimes(2);
    expect(addModule).toHaveBeenCalledTimes(2);
  });

  it('retries a key after a failed load', async () => {
    addModule.mockClear();
    addModule.mockRejectedValueOnce(new Error('boom'));
    const build = (name: string) => `registerProcessor(${JSON.stringify(name)}, class {})`;

    await expect(defineRuntimeWorklet('kernel-c', build)).rejects.toThrow('boom');
    await expect(defineRuntimeWorklet('kernel-c', build)).resolves.toMatch(/^RuntimeWorklet\d+$/);
    expect(addModule).toHaveBeenCalledTimes(2);
  });
});
