import { Component, PropsWithChildren, ReactNode, createElement } from "react";
import { prop, reactive } from "@vicimpa/decorators";

import { BackVariants } from "./BackVariants";
import { NodeMap } from "../node-map";
import { connect } from "@vicimpa/react-decorators";
import detectResize from "./plugins/detectResize";
import detectUpdate from "./plugins/detectUpdate";
import { inject } from "@vicimpa/react-decorators";
import { signalRef } from "$library/signals";

var count = 0;

type variants = typeof BackVariants;

export type TNodeBackProps<T extends keyof variants> = PropsWithChildren<{
  type: T;
}> & Parameters<variants[T]>[0];

@connect(detectResize, detectUpdate)
@reactive()
export class NodeBack<T extends keyof variants> extends Component<TNodeBackProps<T>> {
  _id = count++;
  get id() { return `p:${this._id}:`; }

  @inject(() => NodeMap)
  map!: NodeMap;

  pattern = signalRef<SVGPatternElement>();
  group = signalRef<SVGGElement>();
  rect = signalRef<SVGRectElement>();

  block = 25 * 5.5 * 100;

  @prop x = 0;
  @prop y = 0;
  @prop width = 1;
  @prop height = 1;

  render(): ReactNode {
    const { type, children, ...props } = this.props;
    return (
      <>
        <g data-nodeback="">
          <defs>
            <pattern
              id={this.id}
              ref={this.pattern}
              patternUnits="userSpaceOnUse"
            >
              <g ref={this.group} data-nodeback-pattern="">
                {createElement(BackVariants[type], props)}
              </g>
            </pattern>
          </defs>
          <rect fill={`url(#${this.id})`} ref={this.rect} />
        </g>
        {children}
      </>
    );
  }
}