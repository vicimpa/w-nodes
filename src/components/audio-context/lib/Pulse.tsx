import { FC } from "react";
import { Row } from "./Row";
import { SignalNode } from "./signalNode";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { useComputed } from "@preact/signals-react";

export type TPulseProps = {
  value: SignalNode;
  label: string;
  text?: string;
};

// Кнопка-триггер: 1, пока зажата, иначе 0. Порт рядом — для провода
export const Pulse: FC<TPulseProps> = ({ value, label, text = 'Press' }) => {
  const linked = useComputed(() => value.connected);
  const release = () => {
    if (!value.connected && value.peek())
      value.value = 0;
  };

  return (
    <Row label={label} port={value} linked={linked}>
      <rsp.button
        className={s.field}
        style={{ justifyContent: 'center', border: 'none' }}
        disabled={linked}
        onMouseDown={() => value.value = 1}
        onMouseUp={release}
        onMouseLeave={release}
      >
        {text}
      </rsp.button>
    </Row>
  );
};
