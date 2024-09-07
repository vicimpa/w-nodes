import { Component, PropsWithChildren } from "react";

import { NodeMap } from "../node-map";
import { connect } from "$library/connect";
import detectViewDiv from "./plugins/detectViewDiv";
import detectViewSvg from "./plugins/detectViewSvg";
import { inject } from "$library/provider";
import s from "./NodeView.module.sass";
import { signalRef } from "$library/signals";

export type NodeViewProps = {
  type: 'div' | 'svg';
} & PropsWithChildren;

@connect(detectViewSvg, detectViewDiv)
export class NodeView extends Component<NodeViewProps> {
  @inject(() => NodeMap) map!: NodeMap;

  svg = signalRef<SVGSVGElement>();
  div = signalRef<HTMLDivElement>();

  render() {
    if (this.props.type === "div")
      return (
        <div className={s.view}>
          <div ref={this.div}>
            {this.props.children}
          </div>
        </div>
      );

    return (
      <svg ref={this.svg} viewBox="0 0 0 0" className={s.viewSvg}>
        {this.props.children}
      </svg>
    );
  }
}