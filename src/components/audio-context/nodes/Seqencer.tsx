import { Component, ReactNode } from "react";
import { batch, computed, effect, untracked } from "@preact/signals-react";
import { ceil, floor } from "$library/math";
import { prop, reactive } from "$library/signals";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import SequenceProcessor from "../worklet/SequenceProcessor";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { connect } from "$library/connect";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { group } from "../_groups";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";
import { start } from "../lib/start";
import { store } from "$library/store";
import styled from "styled-components";
import { windowEvents } from "$library/events";

const from = Array.from({ length: 16 }, (_, i) => i);

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  background: #111;
  padding: 5px;
  border-radius: 5px;
`;

const Point = styled.div<{ $active?: any; }>`
  width: 10px;
  height: 15px;
  border-radius: 5px;
  background-color: ${p => p.$active ? '#fff' : '#333'};
  cursor: pointer;
`;

const Cursor = styled(Point) <{ $disable?: any; }>`
  height: 5px;
  cursor: default;
  background-color: ${p => p.$disable ? '#f00' : p.$active ? '#0f0' : '#111'};
`;

const CursorRow = styled.tr`
  ${Row} {
    background: none;
    padding: 0 inherit;
  }
`;

const Base = styled.tr`
  ${Row} {
    margin-bottom: 5px;
  }
`;

function groupFor(nodes: ReactNode[], groupSize = 4) {
  return (
    <>
      {
        Array.from(
          { length: ceil(nodes.length / groupSize) },
          (_, i) => (
            <td key={i} data-group={i} style={{ padding: '0 5px' }}>
              <Row>
                {nodes.slice(i++ * groupSize, i * groupSize)}
              </Row>
            </td>
          )
        )
      }
    </>
  );
}

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
    }),
    effect(() => {
      var values = untracked(() => ctx.main.values);
      values[ctx.index] = ctx.signalValue;
      ctx.processor.props.value = ctx.signalValue;
    }),
    () => ctx.processor.destroy()
  )
))
@reactive()
class SequencerLine extends Component<{ main: Seqencer; value: number; index: number; signalValue: number; }> {
  processor = new SequenceProcessor();

  main = this.props.main;
  @prop value = this.props.value;
  @prop signalValue = this.props.signalValue;
  index = this.props.index;

  _from = computed(() => (
    groupFor(
      from.map(i => (
        <Point
          key={i}
          $active={(this.value >> i) & 1}
          data-item={i}
          onMouseDown={() => {
            var val = +!((this.value >> i) & 1);
            var def = ~(1 << i) & this.value;
            this.value = def | (val << i);
            this.main.mouseDown = true;
          }}
          onMouseEnter={() => {
            if (!this.main.mouseDown)
              return;

            var val = +!((this.value >> i) & 1);
            var def = ~(1 << i) & this.value;
            this.value = def | (val << i);
            this.main.mouseDown = true;
          }} />
      ))
    )
  ));

  _inputValue = computed(() => (
    <input
      type="number"
      style={{ width: 60, height: '100%' }}
      value={this.signalValue}
      onKeyDown={e => {
        if (e.code === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      onChange={e => {
        var val = +e.currentTarget.value;

        if (isNaN(val))
          e.currentTarget.value = `${this.signalValue}`;
        else
          this.signalValue = val;
      }} />
  ));

  render(): ReactNode {
    this.main = this.props.main;
    this.value = this.props.value;
    this.index = this.props.index;
    this.signalValue = this.props.signalValue;

    return (
      <>
        <td />

        <td>
          {this._inputValue}
        </td>

        {this._from}

        <td>
          <button
            disabled={!(this.main.lines.length - 1)}
            onClick={() => this.main.remove(this.index)}
          >
            Remove
          </button>
        </td>
        <td>
          <AudioPort value={this.processor} output />
        </td>
      </>
    );
  }
}

@name('Seqencer')
@group('custom')
@connect((ctx) => (
  dispose(
    windowEvents('mouseup', () => ctx.mouseDown = false),
    windowEvents('blur', () => ctx.mouseDown = false)
  )
))
@reactive()
export default class Seqencer extends BaseNode {
  _time = new SignalNode(0, { default: 0 });
  _constant = new ConstantSourceNode(ctx, { offset: -16 });
  _timeOut = new SignalNode(0, { default: 0 });

  @store id = 0;
  @store @prop lines: number[] = [
    this.id++ << 16
  ];

  @store @prop values: number[] = [
    1
  ];

  _connect = () => (
    dispose(
      start(this._constant),
      pipe(this._time.node, this._timeOut.node.offset),
      pipe(this._constant, this._timeOut.node.offset)
    )
  );

  mouseDown = false;

  append() {
    batch(() => {
      this.lines = [...this.lines, this.id++ << 16];
      this.values = [...this.values, 1];
    });
  }

  remove(index: number) {
    batch(() => {
      this.lines = this.lines.toSpliced(index, 1);
      this.values = this.values.toSpliced(index, 1);
    });
  }

  _cursor = computed(() => (
    groupFor(
      Array.from({ length: 16 }, (_, i) => (
        <Cursor key={i} $disable={this._time.value <= 0 || this._time.value > 16} $active={floor(this._time.value) === i} />
      ))
    )
  ));

  _view = () => (
    computed(() => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <table style={{ borderSpacing: 0 }}>
          <tbody>
            {
              <CursorRow >
                <td>
                  <SignalPort value={this._time} title="time" />
                </td>
                <td />

                {this._cursor}

                <td></td>
                <td>
                  <SignalPort value={this._timeOut} output title="time" />
                </td>
              </CursorRow>
            }
            {
              this.lines.map((line, index) => {
                var key = line >> 16;
                var value = line & 0xFFFF;

                return (
                  <Base key={key}>
                    <SequencerLine
                      main={this}
                      value={value}
                      signalValue={this.values[index]}
                      index={index} />
                  </Base>
                );
              })
            }
          </tbody>
        </table>
        <button onClick={() => this.append()}>Append</button>
      </div>
    ))
  );
}