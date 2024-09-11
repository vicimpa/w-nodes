import { BaseNode } from "../lib/BaseNode";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { group } from "../_groups";
import { name } from "$library/function";

@name('ShowValue')
@group('analyze')
export default class extends BaseNode {
  _in = new SignalNode(0, { default: 0 });

  input = (
    <SignalPort value={this._in} />
  );

  _view = () => (
    <div style={{
      display: 'flex',
      width: 250,
      height: 100,
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h3 style={{
        padding: '5px',
        background: '#444',
        fontFamily: 'monospace',
        flexGrow: 1,
        textAlign: 'right'
      }}>
        {this._in}
      </h3>
    </div>
  );
}