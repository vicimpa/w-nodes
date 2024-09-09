import { Component, ReactNode } from "react";
import { computed, effect, untracked } from "@preact/signals-react";
import { prop, reactive } from "$library/signals";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import SequenceProcessor from "../worklet/SequenceProcessor";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { connect } from "$library/connect";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";
import { store } from "$library/store";

const from = Array.from({ length: 16 }, (_, i) => i);

@connect((ctx) => (
  dispose(
    pipe(ctx.main._time, ctx.processor.time),
    effect(() => {
      ctx.processor.props.seqence = ctx.value;
      var lines = untracked(() => ctx.main.lines);
      var key = lines[ctx.index] >> 16;
      var value = lines[ctx.index] & 0xFFFF;
      if (value !== ctx.value) {
        ctx.main.lines = lines.toSpliced(
          ctx.index,
          1,
          (key << 16) | (ctx.value & 0xFFFF)
        );
      }
    })
  )
))
@reactive()
class SequencerLine extends Component<{ main: Seqencer; value: number; index: number; }> {
  processor = new SequenceProcessor();

  main = this.props.main;
  @prop value = this.props.value;
  index = this.props.index;

  _from = computed(() => (
    from.map(i => (
      <div
        key={i}
        onClick={() => {
          var val = +!((this.value >> i) & 1);
          var def = ~(1 << i) & this.value;
          this.value = def | (val << i);
        }}
        style={{
          width: 10,
          height: 15,
          borderRadius: 5,
          marginRight: (i && !((i + 1) % 4)) ? 10 : 0,
          backgroundColor: (this.value >> i) & 1 ? '#fff' : '#333',
          cursor: 'pointer'
        }} />
    ))
  ));

  render(): ReactNode {
    this.main = this.props.main;
    this.value = this.props.value;
    this.index = this.props.index;

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '5px 10px', background: '#111' }}>
        <div style={{ display: 'flex', gap: 10, flexGrow: 1 }}>
          {this._from}
        </div>

        <button
          disabled={!(this.main.lines.length - 1)}
          onClick={() => this.main.remove(this.index)}
        >
          Remove
        </button>
        <AudioPort value={this.processor} output />
      </div>
    );
  }
}

@name('Seqencer')
@reactive()
export default class Seqencer extends BaseNode {
  _time = new SignalNode(0, { default: 0 });

  @store id = 0;
  @store @prop lines: number[] = [
    this.id++ << 16
  ];

  append() {
    this.lines = [...this.lines, this.id++ << 16];
  }

  remove(index: number) {
    this.lines = this.lines.toSpliced(index, 1);
  }

  input = (
    <SignalPort value={this._time} title="time" />
  );

  _view = () => (
    computed(() => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {
          this.lines.map((line, index) => {
            var key = line >> 16;
            var value = line & 0xFFFF;

            return (
              <SequencerLine
                main={this}
                key={key}
                value={value}
                index={index} />
            );
          })
        }
        <button onClick={() => this.append()}>Append</button>
      </div>
    ))
  );
}