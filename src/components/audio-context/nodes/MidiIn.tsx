import { MidiChannel, MidiDevice, MidiStatus, followDevice } from "../lib/Midi";
import { NoteStack, TMidiMessage, noteName, noteToFreq, pitchBendValue, subscribe } from "$library/midi";
import { computed, effect, signal } from "@preact/signals-react";
import { group, icon } from "../_groups";

import { BaseNode } from "../lib/BaseNode";
import { Piano } from "lucide-react";
import { Row } from "../lib/Row";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { store } from "$components/node-editor";

@name('MidiIn')
@group('io')
@icon(Piano)
export default class extends BaseNode {
  @store _device = signal('all');
  @store _deviceName = signal('');
  @store _channel = signal(0);

  _note = new SignalNode(0, { min: 0, max: 127, default: 0 });
  _freq = new SignalNode(0, { min: 0, default: 0 });
  _gate = new SignalNode(0, { min: 0, max: 1, default: 0 });
  _velocity = new SignalNode(0, { min: 0, max: 1, default: 0 });
  _bend = new SignalNode(0, { min: -1, max: 1, default: 0 });

  _last = signal<number | null>(null);
  _stack = new NoteStack();

  apply() {
    const top = this._stack.top;

    if (!top) {
      this._gate.value = 0;
      return;
    }

    this._note.value = top.note;
    this._freq.value = noteToFreq(top.note);
    this._velocity.value = top.velocity;
    this._gate.value = 1;
    this._last.value = top.note;
  }

  release() {
    this._stack.clear();
    this.apply();
  }

  handle = ({ type, channel, data: [a, b] }: TMidiMessage) => {
    const filter = this._channel.peek();

    if (filter && channel !== filter)
      return;

    switch (type) {
      case 'noteon':
        this._stack.press(a, b / 127);
        return this.apply();
      case 'noteoff':
        this._stack.release(a);
        return this.apply();
      case 'pitchbend':
        this._bend.value = pitchBendValue(a, b);
        return;
      case 'cc':
        // All Sound Off / All Notes Off — снять всё
        if (a === 120 || a === 123)
          this.release();
        return;
    }
  };

  _connect = () => (
    dispose(
      followDevice(this._device, this._deviceName),
      effect(() => {
        // смена устройства или канала снимает зажатые ноты
        this._channel.value;

        return dispose(
          subscribe(this._device.value, this.handle),
          () => this.release(),
        );
      }),
    )
  );

  output = (
    <>
      <SignalPort value={this._note} output title="note" />
      <SignalPort value={this._freq} output title="freq" />
      <SignalPort value={this._gate} output title="gate" />
      <SignalPort value={this._velocity} output title="velocity" />
      <SignalPort value={this._bend} output title="bend" />
    </>
  );

  _lastName = computed(() => this._last.value === null ? '—' : noteName(this._last.value));
  _active = computed(() => this._gate.value ? s.active : undefined);

  _view = () => (
    <>
      <MidiStatus />
      <MidiDevice device={this._device} name={this._deviceName} />
      <MidiChannel channel={this._channel} />
      <Row label="Note">
        <div className={s.field}>
          <rsp.span className={this._active}>{this._lastName}</rsp.span>
        </div>
      </Row>
    </>
  );
}
