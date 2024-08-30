import { NodeItem, NodePort } from "$components/node-editor";

import { computed } from "@preact/signals-react";

export class TestNode extends NodeItem {

  view = () => {
    return (
      computed(() => (
        <div style={{ background: '#444', border: `3px solid ${this.select ? '#f00' : 'transparent'}` }} data-drag>
          <h1>Hello world!</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>

            <NodePort />
            <NodePort output />
          </div>
        </div>
      ))
    );
  };
}