import { Component, PropsWithChildren, ReactNode } from "react";

import { NodeView } from "../node-view";
import { provide } from "@vicimpa/react-decorators";
import { signalRef } from "$library/signals";

@provide()
export class NodeLayers extends Component<PropsWithChildren> {
  pre = signalRef<SVGGElement>();
  post = signalRef<SVGGElement>();

  render(): ReactNode {
    return (
      <>
        <NodeView type="svg">
          <g ref={this.pre} data-nodelayers-pre=""></g>
        </NodeView>

        {this.props.children}

        <NodeView type="svg">
          <g ref={this.post} data-nodelayers-post=""></g>
        </NodeView>
      </>
    );
  }
}