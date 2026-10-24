import { prop, reactive, } from "@vicimpa/decorators";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { connect } from "@vicimpa/react-decorators";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";
import { group, icon } from "../_groups";
import { Mic } from "lucide-react";
import { name } from "$library/function";

@name('Input')
@group('io')
@icon(Mic)
@reactive()
@connect(self => {
  var media: MediaStream | null = null;
  var alive = true;

  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
      if (!alive)
        return stream.getTracks().forEach(track => track.stop());

      media = stream;
      self.stream = ctx.createMediaStreamSource(stream);
    });

  return dispose(
    effect(() => {
      if (!self.stream)
        return;

      self.stream.connect(self._gain);
      return () => {
        self.stream?.disconnect(self._gain);
      };
    }),
    () => {
      alive = false;
      media?.getTracks().forEach(track => track.stop());
      self.stream = null;
    }
  );
})
export default class extends BaseNode {
  _gain = new GainNode(ctx);

  @prop stream: MediaStreamAudioSourceNode | null = null;

  output = (
    <AudioPort value={this._gain} output />
  );

  _view = () => (
    <>
    </>
  );
}
