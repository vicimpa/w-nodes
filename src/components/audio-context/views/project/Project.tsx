import { Component, PropsWithChildren, ReactNode } from "react";
import { connect, provide } from "@vicimpa/react-decorators";
import { prop, reactive } from "@vicimpa/decorators";

import { ProjectControll } from "./ProjectControll";
import { SignalNode } from "$components/audio-context/lib/signalNode";
import TimerProcessor from "$components/audio-context/worklet/TimerProcessor";
import { computed } from "@preact/signals-react";
import detectControlls from "./plugins/detectControlls";
import detectMount from "./plugins/detectMount";
import detectState from "./plugins/detectState";

@provide()
@connect(
  detectMount,
  detectState,
  detectControlls,
)
@reactive()
export class Project extends Component<PropsWithChildren> {
  @prop run = 0 as 0 | 1 | 2;
  @prop temp = 120;
  @prop length = 1;
  @prop controlls = 0;

  time = new TimerProcessor();
  timeView = new SignalNode(0, { default: 0 });

  _view = computed(() => {
    if (!this.controlls)
      return null;

    return <ProjectControll project={this} />;
  });

  render(): ReactNode {
    return (
      <>
        {this.props.children}
        {this._view}
      </>
    );
  }
}