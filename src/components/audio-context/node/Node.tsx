import { NodeItem } from "$components/node-editor/node-item";
import { NodePort } from "$components/node-editor/node-port";
import s from "./Node.module.sass";

export const Node = ({ x = 0, y = 0 }) => {

  return (
    <NodeItem x={x} y={y} >
      <div className={s.node}>
        <div className={s.head} data-controll>
          <p className={s.title} data-drag>⚡️ #1 Color 3</p>
        </div>
        <div className={s.content} data-controll>
          <p style={{ textAlign: 'left' }}>
            <NodePort />
            {' '}
            Port 1
          </p>
          <p style={{ textAlign: 'left' }}>
            <NodePort />
            {' '}
            Port 2
          </p>
          <p style={{ textAlign: 'left' }}>
            <NodePort />
            {' '}
            Port 3
          </p>
          <div>
            <textarea />
          </div>
          <p style={{ textAlign: 'right' }}>
            Port 1
            {' '}
            <NodePort output />
          </p>
          <p style={{ textAlign: 'right' }}>
            Port 2
            {' '}
            <NodePort output />
          </p>
          <p style={{ textAlign: 'right' }}>
            Port 3
            {' '}
            <NodePort output />
          </p>
        </div>
      </div>
    </NodeItem>
  );
};