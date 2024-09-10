import { defineWorklet } from "../lib/defineWorklet";

export default await defineWorklet({
  params: {
    value: {
      defaultValue: 0
    },
    write: {
      defaultValue: 0,
      minValue: 0,
    }
  },
  context: {
    value: 0,
  },
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1
  },
  loop(outL) {
    for (var i = 0; i < this.numFrames; i++) {
      var value = this.param('value', i);
      var write = this.param('write', i);

      if (write) {
        this.context.value = value;
      }

      outL[i] = this.context.value;
    }
  }
});