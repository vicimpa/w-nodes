import { defineWorklet } from "../lib/defineWorklet";

export default await defineWorklet({
  params: {
    start: {
      defaultValue: 0,
      minValue: 0,
      maxValue: 1
    },
    loop: {
      defaultValue: 0,
      minValue: 0,
    },
    revert: {
      defaultValue: 1
    },
    speed: {
      defaultValue: 1
    },
  },
  context: {
    time: 0
  },
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2]
  },
  loop(outL, outR) {
    for (var i = 0; i < this.numFrames; i++) {
      var start = this.param('start', i);
      var loop = this.param('loop', i);
      var speed = this.param('speed', i);
      var revert = this.param('revert', i);

      if (start)
        this.context.time += (1 / this.sampleRate) * speed;
      else if (revert > 0)
        this.context.time = 0;

      if (loop > 0)
        this.context.time %= loop;

      var result = this.context.time;

      outL[i] = result;
      outR[i] = result;
    }
  }
});