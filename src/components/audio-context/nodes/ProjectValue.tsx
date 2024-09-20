import { BaseNode } from "../lib/BaseNode";
import { Project } from "../views/project";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { connect } from "@vicimpa/react-decorators";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";
import { group } from "../_groups";
import { inject } from "@vicimpa/react-decorators";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";
import { store } from "$components/node-editor";

@name('Project')
@connect(ctx => (
  dispose(
    effect(() => {
      ctx._run.value = ctx.source.run & 1;
    }),
    pipe(ctx.source.time, ctx._time),
    (
      ctx.source.controlls++,
      () => { ctx.source.controlls--; }
    )
  )
))
@group('high')
export default class extends BaseNode {
  @inject(() => Project) source!: Project;

  @store
  get temp() {
    return this.source.temp;
  }
  set temp(v) {
    this.source.temp = v;
  }

  _run = new SignalNode(0, { default: 0 });
  _time = new SignalNode(0, { default: 0 });

  output = (
    <>
      <SignalPort title="run" value={this._run} output />
      <SignalPort title="time" value={this._time} output />
    </>
  );
}