import { defineWorklet } from "../lib/defineWorklet";

export default await defineWorklet({
  params: {
    time: {
      defaultValue: 0,
    }
  },
  props: {
    seqence: 0,
    value: 1,
  },
  context: {
    frame: 0
  },
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1
  },
  loop(outL) {
    for (let i = 0; i < this.numFrames; i++) {
      var frame = this.param('time', i);

      if (frame <= 0 || frame >= 16)
        continue;

      frame |= 0;

      var seqence = +this.props.seqence;
      var value = isNaN(seqence) ? 0 : seqence & 0xFFFF;

      if (this.context.frame !== frame) {
        this.context.frame = frame;
        continue;
      }

      var frameValue = (value >>> frame) & 1;

      outL[i] = frameValue * (this.props.value ?? 1);
    }
  },
});