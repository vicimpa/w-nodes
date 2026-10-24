import Analyzer from "./nodes/Analyzer";
import { BaseNode } from "./lib/BaseNode";
import BiSlider from "./nodes/BiSlider";
import BiquadFilter from "./nodes/BiquadFilter";
import ChannelSplitter from "./nodes/ChannelSplitter";
import Convolver from "./nodes/Convolver";
import Delay from "./nodes/Delay";
import Destination from "./nodes/Destination";
import Drums from "./nodes/Drums";
import DynamicsCompressor from "./nodes/DynamicsCompressor";
import Gain from "./nodes/Gain";
import Impulse from "./nodes/Impulse";
import Input from "./nodes/Input";
import Keyboard from "./nodes/Keyboard";
import Math from "./nodes/Math";
import Memory from "./nodes/Memory";
import Oscillator from "./nodes/Oscillator";
import Oscilloscope from "./nodes/Oscilloscope";
import Panner from "./nodes/Panner";
import Player from "./nodes/Player";
import ProjectValue from "./nodes/ProjectValue";
import Recorder from "./nodes/Recorder";
import Sequencer from "./nodes/Sequencer";
import ShowValue from "./nodes/ShowValue";
import Slider from "./nodes/Slider";
import Smoothing from "./nodes/Smoothing";
import StereoPanner from "./nodes/StereoPanner";
import Timer from "./nodes/Timer";
import Toggle from "./nodes/Toggle";
import Turner from "./nodes/Turner";
import Note from "./nodes/Note";
import Sampler from "./nodes/Sampler";
import Constant from "./nodes/Constant";
import Group from "./blocks/Group";
import { GroupInput, GroupOutput } from "./blocks/GroupIO";
import MidiIn from "./nodes/MidiIn";
import MidiCC from "./nodes/MidiCC";
import Expression from "./nodes/Expression";
import LFO from "./nodes/LFO";
import ADSR from "./nodes/ADSR";
import Random from "./nodes/Random";
import Counter from "./nodes/Counter";

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
  Impulse,
  Memory,
  ChannelSplitter,
  BiSlider,
  Oscilloscope,
  Player,
  StereoPanner,
  Panner,
  Smoothing,
  Sequencer,
  Toggle,
  Drums,
  ProjectValue,
  Input,
  Note,
  Sampler,
  Recorder,
  MidiIn,
  MidiCC,
  Expression,
  Group,
  GroupInput,
  GroupOutput,
  LFO,
  ADSR,
  Random,
  Counter,
  Constant,
] as typeof BaseNode[];