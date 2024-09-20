import { Component, PropsWithChildren, ReactNode } from "react";

import { provide } from "@vicimpa/react-decorators";
import s from "./NodeHud.module.sass";
import { signalRef } from "$library/signals";

@provide()
export class NodeHud extends Component<PropsWithChildren> {
  items = signalRef<HTMLDivElement>();

  render(): ReactNode {
    return (
      <div className={s.hud}>
        {this.props.children}
        <div ref={this.items} className={s.items} />
      </div>
    );
  }
}