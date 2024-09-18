import { ctx, empty } from "../ctx";
import { prop, reactive, signalRef } from "$library/signals";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";
import { group } from "../_groups";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";

@name('Player')
@group('input')
@reactive()
export default class extends BaseNode {
  #gain = new GainNode(ctx);

  @prop fileList: FileList | null = null;

  audio = signalRef<HTMLAudioElement>();

  _connect = () => (
    dispose(
      pipe(this.#gain, empty),
      effect(() => {
        if (!this.audio.value)
          return;

        if (!this.fileList)
          return;

        this.fileList.item(0)?.arrayBuffer()
          .then(buffer => new Blob([buffer]))
          .then(blob => URL.createObjectURL(blob))
          .then(url => this.audio.value!.src = url);
      }),
      effect(() => {
        if (!this.audio.value)
          return;

        const media = ctx.createMediaElementSource(
          this.audio.value
        );

        media.connect(this.#gain);

        return () => {
          media.disconnect(this.#gain);
        };
      })
    )
  );

  output = (
    <AudioPort value={this.#gain} output />
  );

  _view = () => (
    <>
      <input onFocus={e => e.currentTarget.blur()} onChange={e => this.fileList = e.target.files} type="file" />
      <audio onFocus={e => e.currentTarget.blur()} ref={this.audio} controls />
    </>
  );
}