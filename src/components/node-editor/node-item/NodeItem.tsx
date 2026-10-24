import { Component, FC, ReactNode } from "react";
import { NodeList, NodeListItem } from "../node-list";
import { inject, provide } from "@vicimpa/react-decorators";
import { prop, reactive } from "@vicimpa/decorators";

import { NodeMap } from "../node-map";
import { NodePort } from "../node-port";
import { NodeProject } from "../node-project";
import { NodeSelection } from "../node-selection";
import { connect } from "@vicimpa/react-decorators";
import detectCopy from "./plugins/detectCopy";
import detectDrag from "./plugins/detectDrag";
import detectMount from "./plugins/detectMount";
import detectResize from "./plugins/detectResize";
import detectSelect from "./plugins/detectSelect";
import detectView from "./plugins/detectView";
import detectViewDiv from "./plugins/detectViewDiv";
import s from "./NodeItem.module.sass";
import { signalRef } from "$library/signals";
import { store } from "$components/node-editor";

const nonTextInputs = ['range', 'checkbox', 'radio', 'button'];

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
  detectViewDiv,
  detectCopy,
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
  viewDivRef = signalRef<HTMLDivElement>();

  ports = new Set<NodePort>();

  get sortPorts() {
    return [...this.ports]
      .map((port, index) => {
        const type = this.project.ports.findIndex(type => port instanceof type) + 1;
        const output = port.props.output ?? false;

        var num = (+output + 1);

        num = (num << 8) | type;
        num = (num << 8) | index;

        return {
          num,
          port
        };
      })
      .sort((a, b) => a.num - b.num)
      .map(({ port }) => port);
  }

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
        <div className={s.itemDiv} ref={this.viewDivRef}>
          <div
            ref={this.fillRef}
            style={{ padding: this.padding }}
            className={s.fill}
            onKeyDown={e => {
              const { target } = e;

              // Ввод в поля ноды не должен запускать горячие клавиши редактора (Delete, Ctrl+C...)
              if (
                target instanceof HTMLTextAreaElement ||
                (target instanceof HTMLInputElement && !nonTextInputs.includes(target.type)) ||
                (target instanceof HTMLElement && target.isContentEditable)
              )
                e.stopPropagation();
            }}
          >
            {<this.view />}
          </div>
        </div>
      </NodeListItem>
    );
  }
}