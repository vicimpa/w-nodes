
import { BaseNode } from "../lib/BaseNode";
import { group, icon } from "../_groups";
import { StickyNote } from "lucide-react";
import { name } from "$library/function";
import { store } from "$components/node-editor";
import { signalRef } from "$library/signals";
import { dom } from "$library/dom";

@name('Note')
@group('misc')
@icon(StickyNote)
export default class extends BaseNode {
  area = dom('textarea', { onkeydown: e => (!e.ctrlKey && !e.metaKey) && e.stopPropagation() });

  // Последний видимый размер: в закрытом блоке offsetWidth/offsetHeight равны 0
  lastWidth = 0;
  lastHeight = 0;

  @store get sizeWidth() { return this.lastWidth = this.area.offsetWidth || this.lastWidth; };
  set sizeWidth(v) { if (v > 0) this.area.style.width = (this.lastWidth = v) + 'px'; }
  @store get sizeHeight() { return this.lastHeight = this.area.offsetHeight || this.lastHeight; };
  set sizeHeight(v) { if (v > 0) this.area.style.height = (this.lastHeight = v) + 'px'; }
  @store get contentText() { return this.area.value; };
  set contentText(v) { this.area.value = v; }

  ref = signalRef<HTMLTextAreaElement>();

  _view = () => (
    <div style={{ display: 'contents' }} ref={r => { r?.appendChild(this.area); }} />
  );
};