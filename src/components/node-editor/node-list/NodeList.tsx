import { Component, PropsWithChildren, ReactNode } from "react";

import { NodeItem } from "../node-item";
import { provide } from "$library/provider";
import { signalRef } from "$library/signals";

@provide()
export class NodeList extends Component<PropsWithChildren> {
  group = signalRef<SVGGElement>();

  items = new Set<NodeItem>();

  render(): ReactNode {
    return (
      <>
        <g ref={this.group} data-nodelist="" />
        <g visibility="hidden" data-nodelist-hidden="">
          {this.props.children}
        </g>
      </>
    );
  }
}