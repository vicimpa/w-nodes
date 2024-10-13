import { prop, reactive, } from "@vicimpa/decorators";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { connect } from "@vicimpa/react-decorators";
import { ctx } from "../ctx";
import { effect } from "@preact/signals-react";
import { group } from "../_groups";
import { name } from "$library/function";

@name('Input')
@group('input')
@reactive()
@connect(self => (
  effect(() => {
    if (!self.stream)
      return;

    self.stream.connect(self._gain);
    return () => {
      self.stream?.disconnect(self._gain);
    };
  })
))
export default class extends BaseNode {
  _gain = new GainNode(ctx);

  @prop stream: MediaStreamAudioSourceNode | null = null;
  @prop devices: MediaDeviceInfo[] = [];

  componentDidMount(): void {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(media => {
        this.stream = ctx.createMediaStreamSource(media);
      });

    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        this.devices = devices.filter(e => e.kind === 'audioinput');
      });
  }

  output = (
    <AudioPort value={this._gain} output />
  );

  _view = () => (
    <>
    </>
  );
}