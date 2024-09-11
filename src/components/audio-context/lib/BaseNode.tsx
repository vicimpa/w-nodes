import { FC, ReactNode } from "react";

import { NodeItem } from "$components/node-editor";
import { computed } from "@preact/signals-react";
import { connect } from "$library/connect";
import { reactive } from "$library/signals";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";

@connect(ctx => ctx._connect())
@reactive()
export class BaseNode extends NodeItem {
  title: string = Object.getPrototypeOf(this)?.constructor?.name ?? 'BaseNode';

  padding = 10;

  head: ReactNode = null;
  input: ReactNode = null;
  output: ReactNode = null;

  canCreate = true;
  canRemove = true;
  isSelect = computed(() => this.select || undefined);

  _connect: () => (() => void) | void = () => { };
  _view: FC = () => null;

  view = () => (
    <rsp.div
      className={`${s.node}`}
      data-select={this.isSelect}
      data-controll
    >
      <header>
        <span data-drag>
          {this.title}
        </span>
        <div>
          {this.head}
          {
            this.canRemove &&
            <button data-delete onMouseDown={() => this.project.destroy(this)} />
          }
        </div>
      </header>
      <main>
        {this.input && (
          <div>
            {this.input}
          </div>
        )}
        <article>
          {<this._view />}
        </article>
        {this.output && (
          <div>
            {this.output}
          </div>
        )}
      </main>
    </rsp.div>
  );
}