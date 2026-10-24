import { FC } from "react";
import { Row } from "./Row";
import { SignalNode } from "./signalNode";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { useComputed } from "@preact/signals-react";

export const Toggle: FC<{ value: SignalNode, label?: string; }> = ({ value, label = 'Enabled' }) => {
  const linked = useComputed(() => value.connected);
  const on = useComputed(() => !!value.value || undefined);
  const text = useComputed(() => value.value ? 'ON' : 'OFF');

  return (
    <Row label={label} port={value} linked={linked}>
      <rsp.button
        className={s.toggle}
        data-on={on}
        disabled={linked}
        onClick={e => {
          value.value = +!value.value;
          e.currentTarget.blur();
        }}
      >
        {text}
      </rsp.button>
    </Row>
  );
};
