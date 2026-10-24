import { TMidiMessage, parseMessage } from "./message";

import { TMidiInput } from "./device";
import { signal } from "@preact/signals-react";

export type TMidiStatus = 'idle' | 'pending' | 'ready' | 'denied' | 'unsupported';

export type TMidiEvent = {
  inputId: string;
  timeStamp: number;
};

export type TMidiHandler = (message: TMidiMessage, event: TMidiEvent) => void;

export const supported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;

export const status = signal<TMidiStatus>(supported ? 'idle' : 'unsupported');
export const inputs = signal<TMidiInput[]>([]);

const handlers = new Map<string, Set<TMidiHandler>>();
const bound = new WeakSet<MIDIInput>();

var access: Promise<MIDIAccess | null> | null = null;

const emit = (key: string, message: TMidiMessage, event: TMidiEvent) => {
  handlers.get(key)?.forEach(handler => {
    try {
      handler(message, event);
    } catch (e) {
      console.error(e);
    }
  });
};

const bind = (input: MIDIInput) => {
  if (bound.has(input))
    return;

  bound.add(input);

  // присваивание onmidimessage неявно открывает порт
  input.onmidimessage = (e) => {
    const message = parseMessage(e.data);

    if (!message)
      return;

    const event = { inputId: input.id, timeStamp: e.timeStamp };
    emit(input.id, message, event);
    emit('all', message, event);
  };
};

const sync = (midi: MIDIAccess) => {
  const list: TMidiInput[] = [];

  midi.inputs.forEach(input => {
    if (input.state === 'disconnected')
      return;

    bind(input);
    list.push({ id: input.id, name: input.name || input.id });
  });

  const prev = inputs.peek();

  if (
    prev.length !== list.length ||
    prev.some((e, i) => e.id !== list[i].id || e.name !== list[i].name)
  ) inputs.value = list;
};

export const request = () => {
  if (!supported)
    return Promise.resolve(null);

  if (access)
    return access;

  status.value = 'pending';

  return access = navigator.requestMIDIAccess({ sysex: false })
    .then(midi => {
      midi.addEventListener('statechange', () => sync(midi));
      sync(midi);
      status.value = 'ready';
      return midi;
    })
    .catch(e => {
      console.warn('MIDI access failed', e);
      // при следующем обращении спросим ещё раз
      access = null;
      status.value = 'denied';
      return null;
    });
};

export const subscribe = (inputId: string | 'all', handler: TMidiHandler) => {
  const set = handlers.get(inputId) ?? new Set<TMidiHandler>();

  handlers.set(inputId, set);
  set.add(handler);
  request();

  return () => {
    set.delete(handler);

    if (!set.size && handlers.get(inputId) === set)
      handlers.delete(inputId);
  };
};
