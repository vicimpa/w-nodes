import { BaseNode } from "../lib/BaseNode";
import { SignalNode } from "../lib/signalNode";
import { SignalPort } from "../ports/SignalPort";
import { group, icon } from "../_groups";
import { Eye } from "lucide-react";
import { name } from "$library/function";

@name('ShowValue')
@group('monitor')
@icon(Eye)
export default class extends BaseNode {
  _in = new SignalNode(0, { default: 0 });

  input = (
    <SignalPort value={this._in} />
  );

  _view = () => (
    <div style={{
      width: 200,
      padding: '10px 12px',
      borderRadius: 'var(--radius-field)',
      background: 'var(--bg-field)',
      color: 'var(--accent)',
      fontSize: 28,
      textAlign: 'right',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      {this._in}
    </div>
  );
}
