import Analyzer from "./nodes/Analyzer";
import { BaseNode } from "./lib/BaseNode";
import BiquadFilter from "./nodes/BiquadFilter";
import Convolver from "./nodes/Convolver";
import Destination from "./nodes/Destination";
import DynamicsCompressor from "./nodes/DynamicsCompressor";
import Gain from "./nodes/Gain";
import Keyboard from "./nodes/Keyboard";
import Operation from "./nodes/Operation";
import Oscillator from "./nodes/Oscillator";
import ShowValue from "./nodes/ShowValue";
import Turner from "./nodes/Turner";
import Value from "./nodes/Value";

export default [
  BiquadFilter,
  Convolver,
  Destination,
  DynamicsCompressor,
  Gain,
  Oscillator,
  Keyboard,
  Operation,
  Analyzer,
  Value,
  Turner,
  ShowValue,
] as typeof BaseNode[];