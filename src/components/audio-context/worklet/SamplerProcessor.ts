import { defineWorklet } from "../lib/defineWorklet";

export default await defineWorklet({
  name: 'Sampler',
  params: {
    trigger: {
      defaultValue: 0
    },
    rate: {
      defaultValue: 1
    },
    start: {
      defaultValue: 0,
      minValue: 0,
      maxValue: 1,
    },
    end: {
      defaultValue: 1,
      minValue: 0,
      maxValue: 1,
    },
    loop: {
      defaultValue: 0
    },
    gain: {
      defaultValue: 1
    },
  },
  props: {
    channels: [] as any[],
  },
  context: {
    gate: 0,
    voices: [] as { pos: number, held: boolean; }[],
  },
  options: {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  },
  loop(outL, outR) {
    var left: Float32Array = this.props.channels[0];
    var right: Float32Array = this.props.channels[1] ?? left;
    var voices = this.context.voices;

    if (!left || !left.length) {
      voices.length = 0;
      return;
    }

    var length = left.length;

    for (var i = 0; i < this.numFrames; i++) {
      var trigger = this.param('trigger', i);
      var rate = this.param('rate', i);
      var looped = this.param('loop', i) > .5;
      var a = Math.min(Math.max(this.param('start', i), 0), 1) * (length - 1);
      var b = Math.min(Math.max(this.param('end', i), 0), 1) * (length - 1);
      var from = Math.min(a, b);
      var to = Math.max(a, b);

      // Новый голос по фронту триггера; самый старый уступает место
      if (trigger > .5 && this.context.gate <= .5) {
        if (voices.length >= 8)
          voices.shift();

        voices.push({ pos: rate < 0 ? to : from, held: true });
      }

      if (trigger <= .5 && this.context.gate > .5) {
        for (var v = 0; v < voices.length; v++)
          voices[v].held = false;
      }

      this.context.gate = trigger;

      var l = 0;
      var r = 0;

      for (var v = voices.length - 1; v >= 0; v--) {
        var voice = voices[v];

        if (looped && to > from) {
          if (!voice.held) {
            voices.splice(v, 1);
            continue;
          }

          if (voice.pos > to)
            voice.pos = from + (voice.pos - to);
          if (voice.pos < from)
            voice.pos = to - (from - voice.pos);
        } else if (voice.pos > to || voice.pos < from) {
          voices.splice(v, 1);
          continue;
        }

        var k = Math.floor(voice.pos);
        var k2 = Math.min(k + 1, length - 1);
        var f = voice.pos - k;

        l += left[k] + (left[k2] - left[k]) * f;
        r += right[k] + (right[k2] - right[k]) * f;
        voice.pos += rate;
      }

      var gain = this.param('gain', i);

      outL[i] = l * gain;

      if (outR)
        outR[i] = r * gain;
    }
  }
});
