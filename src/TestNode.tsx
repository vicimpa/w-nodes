import { NodeItem, NodePort } from "$components/node-editor";
import { computed, signal } from "@preact/signals-react";

import { reactive } from "$library/signals";
import rsp from "@vicimpa/rsp";
import { store } from "$library/store";

@reactive()
export class TestNode extends NodeItem {
  padding = 5;

  style = computed(() => ({
    background: '#444',
    border: `3px solid ${this.select ? '#f00' : 'transparent'}`
  }));

  @store text = signal('');

  view = () => {
    return (
      <rsp.div style={this.style} data-controll>
        <h1 data-drag>Hello world!</h1>
        <rsp.input bind-value={this.text} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <NodePort />
          <NodePort output />
        </div>
      </rsp.div>
    );
  };
}