import { Circle, Disc, Download, Square } from "lucide-react";
import { addMedia, getMedia, mediaList, mediaRef, parseMediaRef } from "$library/media";
import { computed, effect } from "@preact/signals-react";
import { group, icon } from "../_groups";
import { prop, reactive, } from "@vicimpa/decorators";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Row } from "../lib/Row";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { dom } from "$library/dom";
import { frames } from "$library/frames";
import { name } from "$library/function";
import s from "../styles.module.sass";
import { store } from "$components/node-editor";

const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm']
  .find(type => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) ?? '';

const extension = (mime: string) => mime.includes('ogg') ? 'ogg' : 'webm';

const formatTime = (ms: number) => {
  const seconds = ms / 1000;
  return `${(seconds / 60) | 0}:${`${(seconds % 60) | 0}`.padStart(2, '0')}.${`${(ms % 1000 / 10) | 0}`.padStart(2, '0')}`;
};

// Пишет входящий звук в медиатеку: запись можно сразу подать в Sampler или скачать
@name('Recorder')
@group('io')
@icon(Disc)
@reactive()
export default class extends BaseNode {
  #in = ctx.createMediaStreamDestination();
  #recorder: MediaRecorder | null = null;

  @prop started = 0;
  @prop elapsed = 0;
  @prop @store last = '';

  recording = computed(() => this.started > 0);

  lastName = computed(() => {
    const hash = parseMediaRef(this.last);
    return mediaList.value.find(item => item.hash === hash)?.name ?? '';
  });

  _connect = () => dispose(
    effect(() => {
      if (!this.recording.value)
        return;

      return frames(() => {
        this.elapsed = performance.now() - this.started;
      });
    }),
    () => this.stop()
  );

  start() {
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(this.#in.stream, mimeType ? { mimeType } : {});

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = async () => {
      const type = recorder.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(chunks, { type });
      const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      const info = await addMedia(await blob.arrayBuffer(), `recording-${stamp}.${extension(type)}`, type);
      this.last = mediaRef(info.hash);
    };

    recorder.start();
    this.#recorder = recorder;
    this.elapsed = 0;
    this.started = performance.now();
  }

  stop() {
    if (this.#recorder?.state === 'recording')
      this.#recorder.stop();

    this.#recorder = null;
    this.started = 0;
  }

  async download() {
    const hash = parseMediaRef(this.last);
    const record = hash && await getMedia(hash);

    if (!record)
      return;

    const url = URL.createObjectURL(new Blob([record.data], { type: record.mime }));
    dom('a', { href: url, download: record.name }).click();
    setTimeout(() => URL.revokeObjectURL(url));
  }

  input = (
    <AudioPort value={this.#in} />
  );

  _view = () => (
    computed(() => (
      <>
        <Row label={this.recording.value ? 'Recording' : 'Ready'}>
          <div className={s.field} style={{ justifyContent: 'space-between' }}>
            <span style={{ color: this.recording.value ? 'var(--danger)' : undefined }}>
              {formatTime(this.elapsed)}
            </span>
            <button
              title={this.recording.value ? 'Stop and save to media' : 'Start recording'}
              style={{ border: 'none', padding: 0, background: 'none', display: 'grid', color: 'var(--danger)' }}
              onClick={e => {
                e.currentTarget.blur();
                this.recording.value ? this.stop() : this.start();
              }}
            >
              {this.recording.value ? <Square size={13} fill="currentColor" /> : <Circle size={13} fill="currentColor" />}
            </button>
          </div>
        </Row>
        {this.lastName.value && (
          <Row label="Saved">
            <div className={s.field}>
              <span style={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {this.lastName.value}
              </span>
              <button
                title="Download"
                style={{ border: 'none', padding: 0, background: 'none', display: 'grid' }}
                onClick={() => this.download()}
              >
                <Download size={13} />
              </button>
            </div>
          </Row>
        )}
      </>
    ))
  );
}
