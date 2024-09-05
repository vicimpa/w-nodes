import Analyzer from "./nodes/Analyzer";
import { BaseNode } from "./lib/BaseNode";
import BiquadFilter from "./nodes/BiquadFilter";
import Convolver from "./nodes/Convolver";
import Delay from "./nodes/Delay";
import Destination from "./nodes/Destination";
import DynamicsCompressor from "./nodes/DynamicsCompressor";
import Gain from "./nodes/Gain";
import Inpulse from "./nodes/Inpulse";
import Keyboard from "./nodes/Keyboard";
import Math from "./nodes/Math";
import Memory from "./nodes/Memory";
import Oscillator from "./nodes/Oscillator";
import ShowValue from "./nodes/ShowValue";
import Timer from "./nodes/Timer";
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
  Math,
  Analyzer,
  Value,
  Turner,
  ShowValue,
  Delay,
  Timer,
  Inpulse,
  Memory,
] as typeof BaseNode[];