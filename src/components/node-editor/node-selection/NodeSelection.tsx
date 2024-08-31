import { Component, PropsWithChildren } from "react";
import { inject, provide } from "$library/provider";
import { prop, reactive } from "$library/signals";

import { NodeItem } from "../node-item";
import { NodeList } from "../node-list";
import { NodeMap } from "../node-map";
import { NodeSelectionView } from "./NodeSelectionView";
import { Vec2 } from "$library/vec2";
import { connect } from "$library/connect";
import detectDrag from "./plugins/detectDrag";
import detectSelect from "./plugins/detectSelect";
import detectShift from "./plugins/detectShift";

@provide()
@connect(detectShift, detectDrag, detectSelect)
@reactive()
export class NodeSelection extends Component<PropsWithChildren> {
  @inject(() => NodeMap) map!: NodeMap;
  @inject(() => NodeList) list!: NodeList;

  @prop _shiftCount = 0;
  shiftKey = false;
  _select: NodeItem[] | null = null;

  @prop view: [from: Vec2, to: Vec2] | null = null;
  @prop select: NodeItem[] = [];

  toSelect(...items: NodeItem[]) {
    if (!this.shiftKey) {
      this.select = items;
      return;
    }

    var selected = new Set(this._select ?? this.select);

    for (var item of items) {
      if (selected.has(item)) {
        selected.delete(item);
      } else {
        selected.add(item);
      }
    }

    this.select = [...selected];
  }

  render() {
    return (
      <>
        {this.props.children}
        <NodeSelectionView />
      </>
    );
  }
}