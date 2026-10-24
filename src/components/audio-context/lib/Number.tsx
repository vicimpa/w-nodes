import { NumberInput, Row } from "./Row";
import { useComputed, useSignalEffect } from "@preact/signals-react";

import { SignalNode } from "./signalNode";
import s from "../styles.module.sass";

export type TNumberProps = {
  label: string;
  value: SignalNode;
  change?: ((v: number) => any);
  readonly?: boolean;
};

const format = (value: number) => (
  value % 1 === 0 ? `${value}` : `${+value.toPrecision(6)}`
);

export const Number = ({
  label,
  value,
  change,
  readonly,
}: TNumberProps) => {
  const linked = useComputed(() => !!readonly || value.connected);
  const text = useComputed(() => format(value.value));

  useSignalEffect(() => {
    change?.(value.value);
  });

  return (
    <Row label={label} port={value} linked={linked}>
      <div className={s.field}>
        <NumberInput text={text} disabled={linked} onCommit={v => value.value = v} />
      </div>
    </Row>
  );
};
