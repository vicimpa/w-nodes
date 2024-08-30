import { Component, PropsWithChildren } from "react";
import { inject, provide } from "$library/provider";
import { prop, reactive } from "$library/signals";

import { NodeItem } from "../node-item";
import { NodeList } from "../node-list";
import { NodeMap } from "../node-map";
import { NodeSelectionView } from "./NodeSelectionView";
import { Vec2 } from "$library/vec2";
import { connect } from "$library/connect";
import detectSelect from "./plugins/detectSelect";
import detectSelectItems from "./plugins/detectSelectItems";

@provide()
@connect(detectSelect, detectSelectItems)
@reactive()
export class NodeSelection extends Component<PropsWithChildren> {
  @inject(() => NodeMap) map!: NodeMap;
  @inject(() => NodeList) list!: NodeList;

  @prop view: [from: Vec2, to: Vec2] | null = null;
  @prop select: NodeItem[] = [];

  render() {
    return (
      <>
        {this.props.children}
        <NodeSelectionView />
      </>
    );
  }
}