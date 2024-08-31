import { Component, FC, ReactNode } from "react";
import { NodeList, NodeListItem } from "../node-list";
import { inject, provide } from "$library/provider";
import { prop, reactive, signalRef } from "$library/signals";

import { NodeMap } from "../node-map";
import { NodePort } from "../node-port";
import { NodeProject } from "../node-project";
import { NodeSelection } from "../node-selection";
import { connect } from "$library/connect";
import detectDrag from "./plugins/detectDrag";
import detectMount from "./plugins/detectMount";
import detectResize from "./plugins/detectResize";
import detectSelect from "./plugins/detectSelect";
import detectView from "./plugins/detectView";
import s from "./NodeItem.module.sass";
import { store } from "$library/store";

export interface INodeItemProps {
  x?: number;
  y?: number;
  onMount?: (node: NodeItem) => void;
  onDestroy?: (node: NodeItem) => void;
}

@provide()
@connect(
  detectResize,
  detectView,
  detectDrag,
  detectMount,
  detectSelect,
)
@reactive()
export class NodeItem extends Component<INodeItemProps> {
  @inject(() => NodeMap) map!: NodeMap;
  @inject(() => NodeList) list!: NodeList;
  @inject(() => NodeSelection) selection!: NodeSelection;
  @inject(() => NodeProject) project!: NodeProject;

  viewRef = signalRef<SVGForeignObjectElement>();
  fillRef = signalRef<HTMLDivElement>();
  itemRef = signalRef<NodeListItem>();

  ports = new Set<NodePort>();

  @store @prop x = this.props.x ?? 0;
  @store @prop y = this.props.y ?? 0;

  @prop select = false;

  @prop width = 0;
  @prop height = 0;

  @prop padding = 20;

  view: FC = () => null;

  render(): ReactNode {
    return (
      <NodeListItem ref={this.itemRef}>
        <foreignObject
          ref={this.viewRef}
          className={s.item}
        >
          <div className={s.contain}>
            <div
              ref={this.fillRef}
              style={{ padding: this.padding }}
              className={s.fill}
              onKeyDown={e => {
                if (!(e.target instanceof HTMLElement))
                  return;

                if (e.target.contentEditable === 'false')
                  return;

                if (e.target.contentEditable === 'inherit')
                  return;

                if (e.target.tagName === 'textarea')
                  return e.stopPropagation();

                if (e.target instanceof HTMLInputElement) {
                  if (e.target.type === 'range')
                    return;
                  if (e.target.type === 'buntton')
                    return;
                  if (e.target.type === 'checkbox')
                    return;
                  if (e.target.type === 'radio')
                    return;
                }

                e.stopPropagation();
              }}
            >
              {<this.view />}
            </div>
          </div>
        </foreignObject>
      </NodeListItem>
    );
  }
}