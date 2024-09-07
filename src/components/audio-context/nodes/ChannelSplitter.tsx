import { computed, effect, signal } from "@preact/signals-react";
import { prop, reactive } from "$library/signals";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { ReactNode } from "react";
import { Select } from "../lib/Select";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";

const modes = {
  split: (out: ChannelSplitter) => {
    const input = ctx.createChannelSplitter(2);
    const outLeft = ctx.createGain();
    const outRight = ctx.createGain();

    out._input = (
      <>
        <AudioPort value={input} key="split-in" />
      </>
    );

    out._output = (
      <>
        <AudioPort value={outLeft} key="split-left" output title="left" />
        <AudioPort value={outRight} key="split-right" output title="right" />
      </>
    );

    return dispose(
      pipe(input, outLeft, 0, 0),
      pipe(input, outRight, 1, 0),
    );
  },
  merge: (out: ChannelSplitter) => {
    const output = ctx.createChannelMerger(2);
    const inputLeft = ctx.createGain();
    const inputRight = ctx.createGain();

    out._input = (
      <>
        <AudioPort value={inputLeft} key="merge-left" title="left" />
        <AudioPort value={inputRight} key="merge-right" title="right" />
      </>
    );

    out._output = (
      <>
        <AudioPort key="merge-out" value={output} output />
      </>
    );

    return dispose(
      pipe(inputLeft, output, 0, 0),
      pipe(inputRight, output, 0, 1),
    );
  },
  swap: (out: ChannelSplitter) => {
    const input = ctx.createChannelSplitter(2);
    const output = ctx.createChannelMerger(2);

    out._input = (
      <>
        <AudioPort key="swap-in" value={input} />
      </>
    );

    out._output = (
      <>
        <AudioPort key="swap-out" value={output} output />
      </>
    );

    return dispose(
      (
        input.connect(output, 0, 1),
        input.connect(output, 1, 0),
        () => input.disconnect(output)
      )
    );
  },
} as const;

type Mode = keyof typeof modes;

@name('ChannelSplitter')
@reactive()
export default class ChannelSplitter extends BaseNode {
  @prop _mode = signal(Object.keys(modes)[0] as Mode);

  @prop _input: ReactNode = null;
  @prop _output: ReactNode = null;

  _connect = () => (
    effect(() => {
      return modes[this._mode.value]?.(this);
    })
  );

  input = computed(() => this._input);
  output = computed(() => this._output);

  _view = () => (
    <>
      <Select
        label="Mode"
        value={this._mode}
        variants={
          Object
            .keys(modes)
            .map(value => ({ value: value as Mode }))
        } />
    </>
  );
}