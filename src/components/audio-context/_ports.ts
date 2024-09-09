import { AudioPort } from "./ports/AudioPort";
import { BasePort } from "./lib/BasePort";
import { SignalPort } from "./ports/SignalPort";

export default [
  AudioPort,
  SignalPort,
] as (typeof BasePort)[];