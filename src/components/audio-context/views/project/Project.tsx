import { Component, PropsWithChildren, ReactNode } from "react";
import { connect, provide } from "@vicimpa/react-decorators";
import { prop, reactive } from "@vicimpa/decorators";

import { ProjectControl } from "./ProjectControl";
import { SignalNode } from "$components/audio-context/lib/signalNode";
import TimerProcessor from "$components/audio-context/worklet/TimerProcessor";
import { computed } from "@preact/signals-react";
import detectControls from "./plugins/detectControls";
import detectMount from "./plugins/detectMount";
import detectState from "./plugins/detectState";

@provide()
@connect(
  detectMount,
  detectState,
  detectControls,
)
@reactive()
export class Project extends Component<PropsWithChildren> {
  @prop run = 0 as 0 | 1;
  @prop temp = 120;
  @prop length = 1;
  @prop controls = 0;

  time = new TimerProcessor();
  timeView = new SignalNode(0, { default: 0 });

  _view = computed(() => {
    if (!this.controls)
      return null;

    return <ProjectControl project={this} />;
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