import { createAdsrState, modulation } from "$library/modulation";

import { defineWorklet } from "../lib/defineWorklet";

export default await defineWorklet({
  name: 'ADSR',
  params: {
    gate: {
      defaultValue: 0
    },
    attack: {
      defaultValue: 0.01
    },
    decay: {
      defaultValue: 0.2
    },
    sustain: {
      defaultValue: 0.6
    },
    release: {
      defaultValue: 0.4
    },
    peak: {
      defaultValue: 1
    },
  },
  functions: modulation,
  context: {
    env: createAdsrState(),
  },
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1
  },
  loop(outL) {
    var f = this.functions;
    var env = this.context.env;
    var dt = 1 / this.sampleRate;

    for (var i = 0; i < this.numFrames; i++) {
      outL[i] = f.adsrStep(
        env,
        this.param('gate', i),
        this.param('attack', i),
        this.param('decay', i),
        this.param('sustain', i),
        this.param('release', i),
        this.param('peak', i),
        dt
      );
    }
  }
});
