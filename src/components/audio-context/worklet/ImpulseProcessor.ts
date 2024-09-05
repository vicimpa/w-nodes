import { defineWorklet } from "../lib/defineWorklet";

export default await defineWorklet({
  params: {
    value: {
      defaultValue: 0
    },
    length: {
      defaultValue: 1,
      minValue: 0,
    }
  },
  context: {
    times: 0,
    preview: 0,
  },
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2]
  },
  loop(outL, outR) {
    for (var i = 0; i < this.numFrames; i++) {
      var value = this.param('value', i);
      var length = this.param('length', i);
      var result = 0;

      if (value !== this.context.preview) {
        this.context.preview = value;
        this.context.times = length;
      }

      if (this.context.times > 0) {
        this.context.times--;
        result = this.context.preview;
      }

      outL[i] = result;
      outR[i] = result;
    }
  }
});