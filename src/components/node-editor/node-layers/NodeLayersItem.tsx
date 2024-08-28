import { Component, PropsWithChildren, ReactNode } from "react";
import { inject, provide } from "$library/provider";
import { prop, reactive } from "$library/signals";

import { NodeLayers } from "./NodeLayers";
import { connect } from "$library/connect";
import { createPortal } from "react-dom";
import { effect } from "@preact/signals-react";
import { svg } from "$library/dom";

@provide()
@connect((ctx: NodeLayersItem) => (
  effect(() => {
    const ref = ctx.post ? ctx.layers.post : ctx.layers.pre;
    if (!ref.value) return;

    ref.value.appendChild(ctx.elem);
    ctx.elem.setAttribute('data-nodelist-item', '');

    return () => {
      ctx.elem.remove();
    };
  })
))
@reactive()
export class NodeLayersItem extends Component<PropsWithChildren<{ post?: boolean; }>> {
  @inject(() => NodeLayers) layers!: NodeLayers;

  elem = svg('g', {});

  @prop post = this.props.post ?? false;

  render(): ReactNode {
    this.post = this.props.post ?? false;
    return createPortal(this.props.children, this.elem);
  }
}