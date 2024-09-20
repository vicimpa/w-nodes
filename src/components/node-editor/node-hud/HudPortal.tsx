import { Component, PropsWithChildren, ReactNode } from "react";

import { NodeHud } from "./NodeHud";
import { connect } from "@vicimpa/react-decorators";
import { createPortal } from "react-dom";
import { dom } from "$library/dom";
import { effect } from "@preact/signals-react";
import { inject } from "@vicimpa/react-decorators";
import s from "./NodeHud.module.sass";

@connect((ctx) => (
  effect(() => {
    const { value: items } = ctx.hud.items;
    if (!items) return;
    items.appendChild(ctx.elem);
    return () => ctx.elem.remove();
  })
))
export class HudPortal extends Component<PropsWithChildren> {
  @inject(() => NodeHud) hud!: NodeHud;

  elem = dom('div', { className: s.item });

  render(): ReactNode {
    return createPortal(this.props.children, this.elem);
  }
}