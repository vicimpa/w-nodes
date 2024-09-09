import { defineWorklet } from "../lib/defineWorklet";

export default await defineWorklet({
  params: {
    time: {
      defaultValue: 0,
    }
  },
  props: {
    seqence: 0
  },
  context: {
    frame: 0
  },
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2]
  },
  loop(outL, outR) {
    for (let i = 0; i < this.numFrames; i++) {
      var frame = this.param('time', i);

      if (!frame)
        continue;

      frame |= 0;

      var seqence = +this.props.seqence;
      var value = isNaN(seqence) ? 0 : seqence & 0xFFFF;
      var frameValue = (value >> frame) & 1;

      if (this.context.frame !== frame) {
        this.context.frame = frame;
        continue;
      }

      outL[i] = frameValue;
      outR[i] = frameValue;
    }
  },
});