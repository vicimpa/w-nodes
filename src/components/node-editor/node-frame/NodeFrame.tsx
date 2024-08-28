import { Component, PropsWithChildren, ReactNode, createElement } from "react";
import { prop, reactive, signalRef } from "$library/signals";

import { connect } from "$library/connect";
import { createPortal } from "react-dom";
import detectMount from "./plugins/detectMount";
import detectResize from "./plugins/detectResize";
import { dom } from "$library/dom";
import { provide } from "$library/provider";
import s from "./NodeFrame.module.sass";
import { useSignals } from "@preact/signals-react/runtime";

@provide()
@connect(detectResize, detectMount)
@reactive()
export class NodeFrame extends Component<PropsWithChildren> {
  elem = dom('div', { style: { display: 'contents' } });
  frame = signalRef<HTMLIFrameElement>();
  fill = signalRef<HTMLDivElement>();

  @prop mount = false;

  @prop width = 0;
  @prop height = 0;

  render(): ReactNode {
    return (
      <iframe seamless ref={this.frame} className={s.frame} width={0} height={0} >
        {
          createElement(() => {
            useSignals();

            return createPortal((
              <div className={s.contain}>
                <div ref={this.fill} className={s.fill}>
                  {this.props.children}
                </div>
              </div>
            ), this.elem);
          })
        }
      </iframe>
    );
  }
}