import { defineWorklet } from "../lib/defineWorklet";

export default await defineWorklet({
  params: {
    value: {
      defaultValue: 0
    },
  },
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [1]
  },
  loop(outL) {
    for (var i = 0; i < this.numFrames; i++) {
      outL[i] = this.param('value', i);
    }
  }
});