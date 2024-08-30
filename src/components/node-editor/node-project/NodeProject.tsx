import { Component, PropsWithChildren, ReactNode } from "react";

import { NodeItem } from "../node-item";
import { provide } from "$library/provider";
import { reactive } from "$library/signals";

export type TNodeProjectProps = {
  nodes?: typeof NodeItem[];
} & PropsWithChildren;

@provide()
@reactive()
export class NodeProject extends Component<TNodeProjectProps> {

  render(): ReactNode {
    return (
      <>
        {this.props.children}
      </>
    );
  }
}