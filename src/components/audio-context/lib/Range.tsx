import { CSSProperties, FC } from "react";
import { NumberInput, Row } from "./Row";
import { useComputed, useSignalEffect } from "@preact/signals-react";

import { SignalNode } from "./signalNode";
import { clamp } from "@vicimpa/math";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";

export type TRangeProps = {
  label: string;
  value: SignalNode;
  postfix?: string;
  accuracy?: number;
  readonly?: boolean;
  strict?: boolean;
  onChange?: (v: number) => any;
};

export const Range: FC<TRangeProps> = ({
  label,
  value,
  postfix,
  onChange,
  readonly,
  strict,
  accuracy = 0,
}) => {
  const step = 1 / (10 ** accuracy);
  const linked = useComputed(() => !!readonly || value.connected);
  const limit = (val: number) => strict ? clamp(val, value.min, value.max) : val;
  const text = useComputed(() => value.value.toFixed(accuracy));
  const style = useComputed(() => ({
    '--fill': `${clamp((value.value - value.min) / (value.max - value.min), 0, 1) * 100}%`
  }) as CSSProperties);

  useSignalEffect(() => {
    onChange?.(limit(value.value));
  });

  return (
    <Row label={label} port={value} linked={linked}>
      <div className={s.field}>
        <rsp.input
          type="range"
          className={s.slider}
          style={style}
          min={value.min}
          max={value.max}
          step={step}
          value={value}
          disabled={linked}
          onKeyDown={e => e.preventDefault()}
          onChange={e => value.value = limit(+e.currentTarget.value)}
          onContextMenu={e => {
            e.preventDefault();
            value.value = value.default;
          }} />
        <NumberInput text={text} disabled={linked} onCommit={v => value.value = limit(v)} />
        {postfix && <small>{postfix}</small>}
      </div>
    </Row>
  );
};
