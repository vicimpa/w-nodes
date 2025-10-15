import Analyzer from "./nodes/Analyzer";
import { BaseNode } from "./lib/BaseNode";
import BiSlideer from "./nodes/BiSlideer";
import BiquadFilter from "./nodes/BiquadFilter";
import ChannelSplitter from "./nodes/ChannelSplitter";
import Convolver from "./nodes/Convolver";
import Delay from "./nodes/Delay";
import Destination from "./nodes/Destination";
import Drums from "./nodes/Drums";
import DynamicsCompressor from "./nodes/DynamicsCompressor";
import Gain from "./nodes/Gain";
import Inpulse from "./nodes/Inpulse";
import Input from "./nodes/Input";
import Keyboard from "./nodes/Keyboard";
import Math from "./nodes/Math";
import Memory from "./nodes/Memory";
import Oscillator from "./nodes/Oscillator";
import Oscilloscope from "./nodes/Oscilloscope";
import Panner from "./nodes/Panner";
import Player from "./nodes/Player";
import ProjectValue from "./nodes/ProjectValue";
// import Recorder from "./nodes/Recorder";
import Seqencer from "./nodes/Seqencer";
import ShowValue from "./nodes/ShowValue";
import Slider from "./nodes/Slider";
import Smoothing from "./nodes/Smoothing";
import StereoPanner from "./nodes/StereoPanner";
import Timer from "./nodes/Timer";
import Toggle from "./nodes/Toggle";
import Turner from "./nodes/Turner";
import Note from "./nodes/Note";

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
  Slider,
  Turner,
  ShowValue,
  Delay,
  Timer,
  Inpulse,
  Memory,
  ChannelSplitter,
  BiSlideer,
  Oscilloscope,
  Player,
  StereoPanner,
  Panner,
  Smoothing,
  Seqencer,
  Toggle,
  Drums,
  ProjectValue,
  Input,
  Note,
  // Recorder,
] as typeof BaseNode[];