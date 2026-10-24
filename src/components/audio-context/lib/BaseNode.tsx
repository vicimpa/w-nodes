import { CSSProperties, FC, ReactNode } from "react";
import { getIcon, groupColor } from "../_groups";

import { NodeItem } from "$components/node-editor";
import { X } from "lucide-react";
import { computed } from "@preact/signals-react";
import { connect } from "@vicimpa/react-decorators";
import { reactive } from "@vicimpa/decorators";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";

const humanize = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1 $2');

@connect(ctx => ctx._connect())
@reactive()
export class BaseNode extends NodeItem {
  title: string = humanize(Object.getPrototypeOf(this)?.constructor?.name ?? 'BaseNode');

  padding = 10;

  head: ReactNode = null;
  input: ReactNode = null;
  output: ReactNode = null;

  canCreate = true;
  canRemove = true;
  isSelect = computed(() => this.select || undefined);

  _connect: () => (() => void) | void = () => { };
  _view: FC = () => null;

  view = () => {
    const Icon = getIcon(this.constructor);
    const style = { '--accent': groupColor(this.constructor) } as CSSProperties;

    return (
      <rsp.div
        className={s.node}
        style={style}
        data-select={this.isSelect}
        data-controll
      >
        <header>
          <span data-drag>
            {Icon && <Icon size={15} strokeWidth={2.25} />}
            <span className={s.title}>{this.title}</span>
          </span>
          {this.head}
          {
            this.canRemove &&
            <button
              className={s.delete}
              title="Delete"
              onMouseDown={() => this.project.destroy(this)}
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          }
        </header>
        <main>
          {(this.input || this.output) && (
            <div className={s.io}>
              <div>{this.input}</div>
              <div>{this.output}</div>
            </div>
          )}
          <article>
            {<this._view />}
          </article>
        </main>
      </rsp.div>
    );
  };
}
