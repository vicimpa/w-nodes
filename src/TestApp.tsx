import { Canvas } from "$components/canvas";
import rsp from "@vicimpa/rsp";
import styled from "styled-components";
import { useSignal } from "@preact/signals-react";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const TestApp = () => {
  const x = useSignal('0');
  const y = useSignal('0');

  return (
    <Container>
      <rsp.input
        bind-value={x}
        type="range"
        min={-1}
        max={1}
        step={0.0001} />

      <rsp.input
        bind-value={y}
        type="range"
        min={-1}
        max={1}
        step={0.0001} />

      <Canvas
        width={500}
        height={300}
        draw={(ctx, can) => {
          const { width, height } = can;
          ctx.clearRect(0, 0, width, height);

          console.log('Render');

          const dx = (+x.value + 1) * width / 2;
          const dy = (+y.value + 1) * height / 2;

          ctx.fillStyle = '#f00';

          ctx.beginPath();
          ctx.arc(dx, dy, 30, 0, Math.PI * 2);
          ctx.fill();
          ctx.closePath();
        }} />
    </Container>
  );
};