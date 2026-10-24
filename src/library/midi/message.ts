export type TMidiMessageType =
  | 'noteon'
  | 'noteoff'
  | 'polytouch'
  | 'cc'
  | 'program'
  | 'aftertouch'
  | 'pitchbend'
  | 'system';

export type TMidiMessage = {
  type: TMidiMessageType;
  // 1..16, у системных сообщений 0
  channel: number;
  data: number[];
};

const types: Record<number, TMidiMessageType> = {
  0x80: 'noteoff',
  0x90: 'noteon',
  0xA0: 'polytouch',
  0xB0: 'cc',
  0xC0: 'program',
  0xD0: 'aftertouch',
  0xE0: 'pitchbend',
};

export const parseMessage = (raw: ArrayLike<number> | null | undefined): TMidiMessage | null => {
  if (!raw || !raw.length)
    return null;

  const status = raw[0];

  if (status < 0x80)
    return null;

  const data = Array.from(raw).slice(1);

  if (status >= 0xF0)
    return { type: 'system', channel: 0, data: [status, ...data] };

  const channel = (status & 0x0F) + 1;
  var type = types[status & 0xF0];

  if (type === 'noteon' && !data[1])
    type = 'noteoff';

  return { type, channel, data };
};

// 14 бит, центр 8192 -> -1..1
export const pitchBendValue = (lsb: number, msb: number) => {
  const value = ((msb & 0x7F) << 7 | (lsb & 0x7F)) - 8192;
  return value < 0 ? value / 8192 : value / 8191;
};

export const noteToFreq = (note: number) => 440 * 2 ** ((note - 69) / 12);

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const noteName = (note: number) => (
  `${noteNames[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 1}`
);
