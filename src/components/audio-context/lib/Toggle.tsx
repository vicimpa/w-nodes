import { FC } from "react";
import { SignalNode } from "./signalNode";
import { SignalPort } from "../ports/SignalPort";
import { useComputed } from "@preact/signals-react";

export const Toggle: FC<{ value: SignalNode, label?: string; }> = ({ value, label = 'Ebabled' }) => {

  return useComputed(() => {
    var connected = value.connected;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: '#222', padding: 4 }}>
        <SignalPort value={value} />
        <label
          style={{ flexGrow: 1, display: 'flex', gap: 5, cursor: connected ? '' : 'pointer' }}
        >
          <input style={{ cursor: connected ? '' : 'pointer' }} type="checkbox" onChange={() => value.value = +!value.value} checked={!!value.value} disabled={connected} />
          {connected ? 'Signal' : label}
        </label>
      </div>
    );
  });
};