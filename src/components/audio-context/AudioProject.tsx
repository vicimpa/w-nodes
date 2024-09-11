import { NodeProject } from "$components/node-editor";
import { ReactNode } from "react";
import _nodes from "./_nodes";
import _ports from "./_ports";
import { provide } from "$library/provider";

@provide()
export class AudioProject extends NodeProject {
  nodes = _nodes;
  ports = _ports;

  render(): ReactNode {
    return (
      <>
        {super.render()}
      </>
    );
  }
}