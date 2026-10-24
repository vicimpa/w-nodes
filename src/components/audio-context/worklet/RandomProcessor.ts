import { defineWorklet } from "../lib/defineWorklet";
import { modulation } from "$library/modulation";

export default await defineWorklet({
  name: 'Random',
  params: {
    trigger: {
      defaultValue: 0
    },
    from: {
      defaultValue: 0
    },
    to: {
      defaultValue: 1
    },
    step: {
      defaultValue: 0
    },
  },
  functions: modulation,
  context: {
    trigger: 0,
    value: 0,
    fired: false as boolean,
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
      var from = this.param('from', i);

      if (f.rising(c.trigger, trigger)) {
        c.value = f.randomIn(Math.random(), from, this.param('to', i), this.param('step', i));
        c.fired = true;
      }

      c.trigger = trigger;

      // До первого триггера — нижняя граница
      outL[i] = c.fired ? c.value : from;
    }
  }
});
