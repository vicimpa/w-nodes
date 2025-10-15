
import { BaseNode } from "../lib/BaseNode";
import { group } from "../_groups";
import { name } from "$library/function";
import { store } from "$components/node-editor";
import { signalRef } from "$library/signals";
import { dom } from "$library/dom";

@name('Note')
@group('high')
export default class extends BaseNode {
  area = dom('textarea', { onkeydown: e => (!e.ctrlKey && !e.metaKey) && e.stopPropagation() });

  @store get sizeWidth() { return this.area.offsetWidth; };
  set sizeWidth(v) { this.area.style.width = v + 'px'; }
  @store get sizeHeight() { return this.area.offsetHeight; };
  set sizeHeight(v) { this.area.style.height = v + 'px'; }
  @store get contentText() { return this.area.value; };
  set contentText(v) { this.area.value = v; }

  ref = signalRef<HTMLTextAreaElement>();

  _view = () => (
    <div style={{ display: 'contents' }} ref={r => { r?.appendChild(this.area); }} />
  );
};