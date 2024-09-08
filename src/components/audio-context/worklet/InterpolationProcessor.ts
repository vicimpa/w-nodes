import { defineWorklet } from "../lib/defineWorklet";

export default await defineWorklet({
  params: {
    value: {
      defaultValue: 0
    },
    frames: {
      defaultValue: 500,
      minValue: 1,
    }
  },
  context: {
    fromValue: 0,
    toValue: 0,
    previewValue: 0,
    times: 0,
  },
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2]
  },
  loop(outL, outR) {
    var { context: ctx } = this;

    for (var i = 0; i < this.numFrames; i++) {
      var value = this.param('value', i);
      var count = this.param('frames', i);

      if (count <= 1) {
        ctx.fromValue = value;
        ctx.toValue = value;
        ctx.previewValue = value;
        ctx.times = 0;
        outL[i] = value;
        outR[i] = value;
        continue;
      }

      if (ctx.toValue !== value) {
        ctx.fromValue = ctx.previewValue;
        ctx.toValue = value;
        ctx.times = 0;
      }

      if (ctx.times < count) {
        ctx.times++;
      } else {
        ctx.times = count;
      }

      ctx.previewValue = ctx.fromValue + (ctx.toValue - ctx.fromValue) * (ctx.times / count);

      outL[i] = ctx.previewValue;
      outR[i] = ctx.previewValue;
    }
  }
});