
import { BaseNode } from "../lib/BaseNode";
import { group } from "../_groups";
import { name } from "$library/function";
import { store } from "$components/node-editor";
import { signalRef } from "$library/signals";
import { effect } from "@preact/signals-react";
import { resizeObserver } from "@vicimpa/observers";
import { reactive } from "@vicimpa/decorators";

@name('Note')
@group('high')
@reactive()
export default class extends BaseNode {
  @store sizeWidth = 100;
  @store sizeHeight = 100;
  @store contentText = '';

  ref = signalRef<HTMLTextAreaElement>();

  _connect = () => (
    effect(() => {
      const { value: now } = this.ref;
      if (!now) return;
      now.style.width = this.sizeWidth + 'px';
      now.style.height = this.sizeHeight + 'px';
      now.value = this.contentText;
      return resizeObserver(now, () => {
        this.sizeWidth = now.offsetWidth;
        this.sizeHeight = now.offsetHeight;
      });
    })
  );

  _view = () => (
    <textarea
      ref={this.ref}
      onInput={({ currentTarget }) => this.contentText = currentTarget.value} />
  );
};