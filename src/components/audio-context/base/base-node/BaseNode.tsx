import { Fragment, ReactNode, createElement } from "react";

import { NodeItem } from "$components/node-editor/node-item";
import { Signal } from "@preact/signals-react";
import { connect } from "$library/connect";
import s from "./BaseNode.module.sass";

@connect((ctx) => ctx.__mount())
export class BaseNode extends NodeItem {
  title = 'Base Node';

  input: ReactNode[] = [];
  output: ReactNode[] = [];
  main: ReactNode[] = [];

  __store: { [key: string]: any; } = {};
  __mount = (): void | (() => void) => { };

  store() {
    return JSON.stringify(this.__store);
  }

  restore(str: string) {
    try {
      const data = JSON.parse(str);

      for (const key in data) {
        if (this.__store[key] instanceof Signal) {
          this.__store[key].value = data[key];
        } else {
          this.__store[key] = data[key];
        }
      }

    } catch (e) { }
  }

  __view = () => (
    <div className={s.node}>
      <div className={s.head} data-controll>
        <p className={s.title} data-drag>{this.title}</p>
      </div>
      <div className={s.content} data-controll>
        <div className={s.side}>
          {createElement(Fragment, {}, ...this.input)}
        </div>
        <div className={s.main}>
          {createElement(Fragment, {}, ...this.main)}
        </div>
        <div className={s.side}>
          {createElement(Fragment, {}, ...this.output)}
        </div>
      </div>
    </div>
  );
}