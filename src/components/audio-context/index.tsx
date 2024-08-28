import "./_nodes";

import { Destination } from "./nodes/Destination";
import { Gain } from "./nodes/effects/Gain";

export const AudioContext = () => {

  return (
    <>
      <Destination />
      <Gain />
      <Gain />
      <Gain />
      <Gain />
    </>
  );
};