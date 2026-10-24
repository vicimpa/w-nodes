import { BaseNode } from "../lib/BaseNode";
import { Project } from "../views/project";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { connect } from "@vicimpa/react-decorators";
import { dispose } from "$library/dispose";
import { effect } from "@preact/signals-react";
import { group, icon } from "../_groups";
import { Clapperboard } from "lucide-react";
import { inject } from "@vicimpa/react-decorators";
import { name } from "$library/function";
import { pipe } from "../lib/pipe";
import { store } from "$components/node-editor";

@name('Project')
@connect(ctx => (
  dispose(
    effect(() => {
      ctx._run.value = ctx.source.run;
    }),
    pipe(ctx.source.time, ctx._time),
    (
      ctx.source.controls++,
      () => { ctx.source.controls--; }
    )
  )
))
@group('time')
@icon(Clapperboard)
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