import { defineWorklet } from "../lib/defineWorklet";

export default await defineWorklet({
  params: {
    value: {
      defaultValue: 0
    },
    frames: {
      defaultValue: 500,
      minValue: 1,
      maxValue: 10000,
    }
  },
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2]
  },
  loop(outL, outR) {
    const store = (this.context as { frames?: number[]; });
    const frames = store.frames ?? (store.frames = []);

    for (var i = 0; i < this.numFrames; i++) {
      var value = this.param('value', i);
      var count = this.param('frames', i);

      frames.push(value);

      while (frames.length > count)
        frames.shift();

      var result = frames.reduce((a, b) => a + b) / frames.length;

      outL[i] = result;
      outR[i] = result;
    }
  }
});