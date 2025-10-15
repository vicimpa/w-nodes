import { AudioProject } from "$components/audio-context/AudioProject";
import { examples } from "$components/audio-context/examples";
import { LoadEvent } from "$components/node-editor";
import { HudPortal } from "$components/node-editor/node-hud/HudPortal";
import { useInject } from "@vicimpa/react-decorators";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  gap: 10px;
  top: 30px;
  right: 0;
  padding: 10px;
  background-color: #33333399;
  backdrop-filter: blur(5px);
  text-align: right;

  a {
    color: #fff;
  }
`;

export const Demo = () => {
  const items = Object.entries(examples);
  const project = useInject(AudioProject);

  return (
    <HudPortal>
      <Container>
        <h4>Demo projects:</h4>
        {
          items.map(([key, value], i) => {
            const name = key.split('/').at(-1);

            return (
              <a
                key={i}
                href={'#' + name}
                ref={el => {
                  if (!el) return;
                  if ('#' + name === location.hash)
                    el.click();
                }}
                onClick={async (e) => {
                  e.preventDefault();
                  const module: any = await value();

                  if (!('default' in module))
                    return;

                  const req = await fetch(module.default);
                  const text = await req.text();
                  project.clean();
                  LoadEvent.emit(text);
                }}
              >
                {name}
              </a>
            );
          })
        }
      </Container>
    </HudPortal>
  );
};