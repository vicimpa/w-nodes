import { MidiChannel, MidiDevice, MidiStatus, followDevice } from "../lib/Midi";
import { NumberInput, Row } from "../lib/Row";
import { TMidiMessage, subscribe } from "$library/midi";
import { computed, effect, signal } from "@preact/signals-react";
import { group, icon } from "../_groups";

import { BaseNode } from "../lib/BaseNode";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { SlidersVertical } from "lucide-react";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { store } from "$components/node-editor";

@name('MidiCC')
@group('control')
@icon(SlidersVertical)
export default class extends BaseNode {
  @store _device = signal('all');
  @store _deviceName = signal('');
  @store _channel = signal(0);
  @store _cc = signal(1);

  _value = new SignalNode(0, { min: 0, max: 1, default: 0 });
  _learn = signal(false);

  handle = ({ type, channel, data: [cc, value] }: TMidiMessage) => {
    const filter = this._channel.peek();

    if (type !== 'cc' || (filter && channel !== filter))
      return;

    if (this._learn.peek()) {
      this._cc.value = cc;
      this._learn.value = false;
    }

    if (cc === this._cc.peek())
      this._value.value = value / 127;
  };

  _connect = () => (
    dispose(
      followDevice(this._device, this._deviceName),
      effect(() => subscribe(this._device.value, this.handle)),
      () => this._learn.value = false,
    )
  );

  output = (
    <SignalPort value={this._value} output title="value" />
  );

  _ccText = computed(() => `${this._cc.value}`);
  _learnOn = computed(() => this._learn.value || undefined);
  _learnText = computed(() => this._learn.value ? 'WAIT' : 'LEARN');
  _valueText = computed(() => this._value.value.toFixed(2));

  setCC(value: number) {
    this._cc.value = Math.min(127, Math.max(0, Math.round(value)));
  }

  _view = () => (
    <>
      <MidiStatus />
      <MidiDevice device={this._device} name={this._deviceName} />
      <MidiChannel channel={this._channel} />
      <Row label="CC">
        <div className={s.field}>
          <NumberInput text={this._ccText} onCommit={v => this.setCC(v)} />
        </div>
      </Row>
      <Row label="Learn">
        <rsp.button
          className={s.toggle}
          data-on={this._learnOn}
          onClick={e => {
            this._learn.value = !this._learn.peek();
            e.currentTarget.blur();
          }}
        >
          {this._learnText}
        </rsp.button>
      </Row>
      <Row label="Value">
        <div className={s.field}>
          <rsp.span>{this._valueText}</rsp.span>
        </div>
      </Row>
    </>
  );
}
