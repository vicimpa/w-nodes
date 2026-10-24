import { defineWorklet } from "../lib/defineWorklet";
import { modulation } from "$library/modulation";

export default await defineWorklet({
  name: 'Counter',
  params: {
    trigger: {
      defaultValue: 0
    },
    step: {
      defaultValue: 1
    },
    reset: {
      defaultValue: 0
    },
    modulo: {
      defaultValue: 0
    },
  },
  functions: modulation,
  context: {
    trigger: 0,
    reset: 0,
    count: 0,
  },
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1
  },
  loop(outL) {
    var f = this.functions;
    var c = this.context;

    for (var i = 0; i < this.numFrames; i++) {
      var trigger = this.param('trigger', i);
      var reset = this.param('reset', i);

      // Сброс важнее счёта на том же сэмпле
      if (f.rising(c.reset, reset))
        c.count = 0;
      else if (f.rising(c.trigger, trigger))
        c.count = f.counterStep(c.count, this.param('step', i), this.param('modulo', i));

      c.trigger = trigger;
      c.reset = reset;

      outL[i] = c.count;
    }
  }
});
