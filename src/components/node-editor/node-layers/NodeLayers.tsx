import { Component, PropsWithChildren, ReactNode } from "react";

import { provide } from "$library/provider";
import { signalRef } from "$library/signals";

@provide()
export class NodeLayers extends Component<PropsWithChildren> {
  pre = signalRef<SVGGElement>();
  post = signalRef<SVGGElement>();

  render(): ReactNode {
    return (
      <>
        <g ref={this.pre} data-nodelayers-pre=""></g>
        {this.props.children}
        <g ref={this.post} data-nodelayers-post=""></g>
      </>
    );
  }
}