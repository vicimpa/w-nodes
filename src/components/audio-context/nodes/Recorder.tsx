import { prop, reactive, } from "@vicimpa/decorators";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { computed } from "@preact/signals-react";
import { connect } from "@vicimpa/react-decorators";
import { ctx } from "../ctx";
import { frames } from "$library/frames";
import { group } from "../_groups";
import { name } from "$library/function";

@name('Recorder')
@group('output')
@connect(self => frames(() => {
  let isStart = self.start !== -1;

  if (isStart && self.stream.state === 'paused')
    self.start = -1;

  if (!isStart && self.stream.state === 'recording')
    self.start = performance.now();

  if (!isStart)
    self.remaining = 0;

  if (isStart)
    self.remaining = performance.now() - self.start;
}))
@reactive()
export default class extends BaseNode {
  #in = ctx.createMediaStreamDestination();
  stream = new MediaRecorder(this.#in.stream);

  @prop start = -1;
  @prop remaining = 0;
  @prop records = [];

  input = (
    <AudioPort value={this.#in} />
  );

  _timer = computed(() => {
    let { remaining: time } = this;

    let ms = `${(time | 0) % 1000}`.padStart(3, '0');
    let s = `${((time /= 1000) | 0) % 60}`.padStart(2, '0');
    let m = `${(time /= 60) | 0}`.padStart(2, '0');

    return (
      <p>{m}:{s}:{ms}</p>
    );
  });

  _view = () => (
    <>
      {this._timer}
      <button onClick={() => this.stream.start(0)}>Start</button>
      <button onClick={() => this.stream.pause()}>Stop</button>
    </>
  );
}