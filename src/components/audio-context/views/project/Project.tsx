import { Component, PropsWithChildren, ReactNode } from "react";
import { prop, reactive } from "$library/signals";

import { ProjectControll } from "./ProjectControll";
import { SignalNode } from "$components/audio-context/lib/signalNode";
import TimerProcessor from "$components/audio-context/worklet/TimerProcessor";
import { connect } from "$library/connect";
import detectMount from "./plugins/detectMount";
import detectState from "./plugins/detectState";
import { provide } from "$library/provider";

@provide()
@connect(
  detectMount,
  detectState
)
@reactive()
export class Project extends Component<PropsWithChildren> {
  @prop run = 0 as 0 | 1 | 2;
  @prop temp = 120;
  @prop length = 1;

  time = new TimerProcessor();
  timeView = new SignalNode(0, { default: 0 });

  render(): ReactNode {
    return (
      <>
        {this.props.children}
        <ProjectControll project={this} />
      </>
    );
  }
}