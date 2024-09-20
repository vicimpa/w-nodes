import { Component, PropsWithChildren, ReactNode } from "react";

import { NodeItem } from "../node-item";
import { NodeView } from "../node-view";
import { provide } from "@vicimpa/react-decorators";
import { signalRef } from "$library/signals";

@provide()
export class NodeList extends Component<PropsWithChildren> {
  group = signalRef<HTMLDivElement>();

  items = new Set<NodeItem>();

  render(): ReactNode {
    return (
      <NodeView type="div">
        <div ref={this.group} style={{ display: 'contents' }} data-nodelist="" />
        <div hidden data-nodelist-hidden="">
          {this.props.children}
        </div>
      </NodeView>
    );
  }
}