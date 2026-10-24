import { LfoShape, modulation } from "$library/modulation";

import { defineWorklet } from "../lib/defineWorklet";

export default await defineWorklet({
  name: 'LFO',
  params: {
    rate: {
      defaultValue: 1
    },
    depth: {
      defaultValue: 1
    },
    offset: {
      defaultValue: 0
    },
    phase: {
      defaultValue: 0
    },
    sync: {
      defaultValue: 0
    },
  },
  functions: modulation,
  props: {
    shape: 'sine',
  } as { shape: LfoShape; },
  context: {
    phase: 0,
    sync: 0,
    held: 0,
    seeded: false as boolean,
  },
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1
  },
  loop(outL) {
    var f = this.functions;
    var c = this.context;
    var shape = this.props.shape;

    if (!c.seeded) {
      c.held = Math.random() * 2 - 1;
      c.seeded = true;
    }

    for (var i = 0; i < this.numFrames; i++) {
      var rate = this.param('rate', i);
      var depth = this.param('depth', i);
      var offset = this.param('offset', i);
      var phase = this.param('phase', i);
      var sync = this.param('sync', i);

      // Фронт sync сбрасывает фазу на этом же сэмпле
      if (f.rising(c.sync, sync)) {
        c.phase = 0;
        c.held = Math.random() * 2 - 1;
      }

      c.sync = sync;

      outL[i] = offset + depth * f.lfoShape(shape, c.phase + phase, c.held);

      var inc = rate / this.sampleRate;

      // S&H: новое значение на каждом новом периоде
      if (f.lfoWrapped(c.phase, inc, phase))
        c.held = Math.random() * 2 - 1;

      c.phase = f.wrap(c.phase + inc);
    }
  }
});
