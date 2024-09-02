import Analyzer from "./nodes/Analyzer";
import BiquadFilter from "./nodes/BiquadFilter";
import Convolver from "./nodes/Convolver";
import Destination from "./nodes/Destination";
import DryWet from "./nodes/DryWet";
import DynamicsCompressor from "./nodes/DynamicsCompressor";
import Gain from "./nodes/Gain";
import Keyboard from "./nodes/Keyboard";
import Math from "./nodes/Operation";
import Oscillator from "./nodes/Oscillator";
import Turner from "./nodes/Turner";
import Value from "./nodes/Value";

export default [
  BiquadFilter,
  Convolver,
  Destination,
  DryWet,
  DynamicsCompressor,
  Gain,
  Oscillator,
  Keyboard,
  Math,
  Analyzer,
  Value,
  Turner,
];