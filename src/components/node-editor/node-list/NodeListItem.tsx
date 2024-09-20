import { Component, PropsWithChildren, ReactNode } from "react";
import { inject, provide } from "@vicimpa/react-decorators";

import { NodeList } from "./NodeList";
import { connect } from "@vicimpa/react-decorators";
import { createPortal } from "react-dom";
import { dom } from "$library/dom";
import { effect } from "@preact/signals-react";

var index = 0;

@provide()
@connect((ctx: NodeListItem) => (
  effect(() => {
    const { value: group } = ctx.list.group;
    if (!group) return;

    group.appendChild(ctx.elem);
    ctx.elem.setAttribute('data-nodelist-item', '');

    return () => {
      ctx.elem.remove();
    };
  })
))
export class NodeListItem extends Component<PropsWithChildren> {
  @inject(() => NodeList) list!: NodeList;
  index: number = 0;

  elem = dom('div', { style: { position: 'absolute', zIndex: `${this.index = index++}` } });

  up() {
    if (this.index !== index)
      this.elem.style.zIndex = `${this.index = index++}`;
    // const { value: group } = this.list.group;

    // if (!group) return;
    // if (!group?.contains(this.elem)) return;
    // if (group.lastChild === this.elem) return;
    // group.appendChild(this.elem);
  }

  render(): ReactNode {
    return createPortal(this.props.children, this.elem);
  }
}