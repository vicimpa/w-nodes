import { computed, effect } from "@preact/signals-react";
import { ctx, empty } from "../ctx";
import { getMedia, mediaList, parseMediaRef } from "$library/media";
import { group, icon } from "../_groups";
import { prop, reactive, } from "@vicimpa/decorators";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { FileMusic } from "lucide-react";
import { MediaSelect } from "../lib/MediaSelect";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";
import { signalRef } from "$library/signals";
import { store } from "$components/node-editor";

@name('Player')
@group('io')
@icon(FileMusic)
@reactive()
export default class extends BaseNode {
  #gain = new GainNode(ctx);

  @prop @store media = '';

  audio = signalRef<HTMLAudioElement>();

  available = computed(() => {
    const hash = parseMediaRef(this.media);
    return hash && mediaList.value.some(item => item.hash === hash) ? hash : null;
  });

  _connect = () => (
    dispose(
      pipe(this.#gain, empty),
      effect(() => {
        const audio = this.audio.value;
        const hash = this.available.value;
        var url = '';
        var cancelled = false;

        if (!audio)
          return;

        audio.removeAttribute('src');

        if (hash) {
          getMedia(hash).then(record => {
            if (cancelled || !record)
              return;

            url = URL.createObjectURL(new Blob([record.data], { type: record.mime }));
            audio.src = url;
          });
        }

        return () => {
          cancelled = true;

          if (url)
            URL.revokeObjectURL(url);
        };
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
      <MediaSelect get={() => this.media} set={ref => this.media = ref} />
      <audio
        ref={this.audio}
        controls
        style={{ width: 260, height: 32 }}
        onFocus={e => e.currentTarget.blur()} />
    </>
  );
}
