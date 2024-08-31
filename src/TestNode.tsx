import { NodeItem, NodePort } from "$components/node-editor";
import { prop, reactive } from "$library/signals";

import { computed } from "@preact/signals-react";
import rsp from "@vicimpa/rsp";

@reactive()
export class TestNode extends NodeItem {
  @prop x = Math.random() * 500 - 250;
  @prop y = Math.random() * 500 - 250;

  padding = 5;

  view = () => {
    return (
      <rsp.div
        style={
          computed(() => ({
            background: '#444',
            border: `3px solid ${this.select ? '#f00' : 'transparent'}`
          }))
        }
        data-drag
      >
        <h1>Hello world!</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <NodePort />
          <NodePort output />
        </div>
      </rsp.div>
    );
  };
}