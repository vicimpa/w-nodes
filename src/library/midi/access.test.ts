import { afterEach, describe, expect, it, vi } from "vitest";

const fakeInput = (id: string, name: string) => ({
  id,
  name,
  state: 'connected',
  onmidimessage: null as ((e: { data: Uint8Array; timeStamp: number; }) => void) | null,
  send(...data: number[]) {
    this.onmidimessage?.({ data: new Uint8Array(data), timeStamp: 1 });
  },
});

const fakeAccess = () => {
  const inputs = new Map<string, ReturnType<typeof fakeInput>>();
  const listeners: (() => void)[] = [];

  return {
    inputs,
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    change: () => listeners.forEach(fn => fn()),
  };
};

const load = async (navigator: object) => {
  vi.resetModules();
  vi.stubGlobal('navigator', navigator);
  return import("./access");
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('midi access', () => {
  it('degrades without Web MIDI', async () => {
    const midi = await load({});

    expect(midi.supported).toBe(false);
    expect(midi.status.value).toBe('unsupported');
    expect(await midi.request()).toBeNull();
    midi.subscribe('all', () => { })();
  });

  it('requests access lazily and dispatches messages', async () => {
    const access = fakeAccess();
    access.inputs.set('a', fakeInput('a', 'KeyStep'));

    const requestMIDIAccess = vi.fn(() => Promise.resolve(access));
    const midi = await load({ requestMIDIAccess });

    expect(requestMIDIAccess).not.toHaveBeenCalled();

    const all = vi.fn();
    const one = vi.fn();
    const offAll = midi.subscribe('all', all);
    midi.subscribe('a', one);

    expect(requestMIDIAccess).toHaveBeenCalledTimes(1);
    expect(requestMIDIAccess).toHaveBeenCalledWith({ sysex: false });

    await midi.request();

    expect(midi.status.value).toBe('ready');
    expect(midi.inputs.value).toEqual([{ id: 'a', name: 'KeyStep' }]);

    access.inputs.get('a')!.send(0x90, 60, 100);

    expect(all).toHaveBeenCalledWith(
      { type: 'noteon', channel: 1, data: [60, 100] },
      { inputId: 'a', timeStamp: 1 },
    );
    expect(one).toHaveBeenCalledTimes(1);

    offAll();
    access.inputs.get('a')!.send(0x80, 60, 0);

    expect(all).toHaveBeenCalledTimes(1);
    expect(one).toHaveBeenCalledTimes(2);
  });

  it('follows statechange', async () => {
    const access = fakeAccess();
    const midi = await load({ requestMIDIAccess: () => Promise.resolve(access) });

    await midi.request();
    expect(midi.inputs.value).toEqual([]);

    const input = fakeInput('b', 'Pads');
    access.inputs.set('b', input);
    access.change();

    expect(midi.inputs.value).toEqual([{ id: 'b', name: 'Pads' }]);

    const handler = vi.fn();
    midi.subscribe('b', handler);
    input.send(0xB0, 1, 64);
    expect(handler).toHaveBeenCalledTimes(1);

    input.state = 'disconnected';
    access.change();
    expect(midi.inputs.value).toEqual([]);
  });

  it('reports denied access and allows a retry', async () => {
    const requestMIDIAccess = vi.fn(() => Promise.reject(new Error('denied')));
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    const midi = await load({ requestMIDIAccess });

    expect(await midi.request()).toBeNull();
    expect(midi.status.value).toBe('denied');

    await midi.request();
    expect(requestMIDIAccess).toHaveBeenCalledTimes(2);
  });
});
