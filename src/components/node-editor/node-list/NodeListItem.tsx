import { Component, PropsWithChildren, ReactNode } from "react";
import { inject, provide } from "$library/provider";

import { NodeList } from "./NodeList";
import { connect } from "$library/connect";
import { createPortal } from "react-dom";
import { effect } from "@preact/signals-react";
import { svg } from "$library/dom";

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

  elem = svg('g', {});

  up() {
    const { value: group } = this.list.group;

    if (!group) return;
    if (!group?.contains(this.elem)) return;
    if (group.lastChild === this.elem) return;
    group.appendChild(this.elem);
  }

  render(): ReactNode {
    return createPortal(this.props.children, this.elem);
  }
}