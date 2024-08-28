import { Component, PropsWithChildren, ReactNode } from "react";
import { NodeList, NodeListItem } from "../node-list";
import { inject, provide } from "$library/provider";
import { prop, reactive, signalRef } from "$library/signals";

import { NodeMap } from "../node-map";
import { NodePort } from "../node-port";
import { connect } from "$library/connect";
import detectDrag from "./plugins/detectDrag";
import detectMount from "./plugins/detectMount";
import detectResize from "./plugins/detectResize";
import detectView from "./plugins/detectView";
import s from "./NodeItem.module.sass";

export interface INodeItemProps extends PropsWithChildren {
  x?: number;
  y?: number;
}

@provide()
@connect(
  detectResize,
  detectView,
  detectDrag,
  detectMount,
)
@reactive()
export class NodeItem extends Component<INodeItemProps> {
  @inject(() => NodeMap) map!: NodeMap;
  @inject(() => NodeList) list!: NodeList;

  constructor(props: INodeItemProps, protected __view?: () => ReactNode) {
    super(props);
  }

  view = signalRef<SVGForeignObjectElement>();
  fill = signalRef<HTMLDivElement>();
  item = signalRef<NodeListItem>();

  ports = new Set<NodePort>();

  @prop x = this.props.x ?? 0;
  @prop y = this.props.y ?? 0;

  @prop width = 0;
  @prop height = 0;

  up() {
    this.item.value?.up();
  }

  render(): ReactNode {
    return (
      <NodeListItem ref={this.item}>
        <foreignObject
          ref={this.view}
          className={s.item}
        >
          <div className={s.contain}>
            <div ref={this.fill} className={s.fill}>
              {(this.__view ? <this.__view /> : this.props.children)}
            </div>
          </div>
        </foreignObject>
      </NodeListItem>
    );
  }
}