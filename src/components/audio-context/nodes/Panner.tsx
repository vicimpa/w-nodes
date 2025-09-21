import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Range } from "../lib/Range";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { group } from "../_groups";
import { name } from "$library/function";
import { signal } from "@preact/signals-react";
import { store } from "$components/node-editor";
import { refValue } from "../lib/refValue";

const distanceModels = ['linear', 'inverse', 'exponential'] as const;
const panningModels = ['equalpower', 'HRTF'] as const;

const distanceModelVariants = distanceModels.map((value) => ({ value }));
const panningModelVariants = panningModels.map((value) => ({ value }));

@name('Panner')
@group('base')
export default class extends BaseNode {
  #panner = new PannerNode(ctx);

  @store _innerAngle = new SignalNode(refValue(this.#panner, 'coneInnerAngle'), { min: 0, max: 360 });
  @store _outerAngle = new SignalNode(refValue(this.#panner, 'coneOuterAngle'), { min: 0, max: 360 });
  @store _outerGain = new SignalNode(refValue(this.#panner, 'coneOuterGain'), { min: 0, max: 1 });

  @store _distanceModel = signal(this.#panner.distanceModel);
  @store _maxDistance = new SignalNode(refValue(this.#panner, 'maxDistance'), { min: 0, max: 100 });

  @store _orientationX = new SignalNode(this.#panner.orientationX, { min: -100, max: 100 });
  @store _orientationY = new SignalNode(this.#panner.orientationY, { min: -100, max: 100 });
  @store _orientationZ = new SignalNode(this.#panner.orientationZ, { min: -100, max: 100 });

  @store _panningModel = signal(this.#panner.panningModel);

  @store _positionX = new SignalNode(this.#panner.positionX, { min: -100, max: 100 });
  @store _positionY = new SignalNode(this.#panner.positionY, { min: -100, max: 100 });
  @store _positionZ = new SignalNode(this.#panner.positionZ, { min: -100, max: 100 });

  @store _refDistance = new SignalNode(refValue(this.#panner, 'refDistance'), { min: 0, max: 100 });
  @store _rolloffFactor = new SignalNode(refValue(this.#panner, 'rolloffFactor'), { min: 0, max: 100 });

  _connect = () => (
    dispose(
      this._distanceModel.subscribe(v => {
        this.#panner.distanceModel = v;
      }),
      this._panningModel.subscribe(v => {
        this.#panner.panningModel = v;
      }),
    )
  );

  input = (
    <AudioPort value={this.#panner} />
  );

  output = (
    <AudioPort value={this.#panner} output />
  );

  _view = () => (
    <>
      <div style={{ width: 300 }} />
      <Range label="Inner Angle" value={this._innerAngle} accuracy={4} />
      <Range label="Outer Angle" value={this._outerAngle} accuracy={4} />
      <Range label="Outer Gain" value={this._outerGain} accuracy={3} />
      <hr />
      <Select label="Distance model" value={this._distanceModel} variants={distanceModelVariants} />
      <hr />
      <Range label="Orientation X" value={this._orientationX} accuracy={3} />
      <Range label="Orientation Y" value={this._orientationY} accuracy={3} />
      <Range label="Orientation Z" value={this._orientationZ} accuracy={3} />
      <hr />
      <Select label="Panning model" value={this._panningModel} variants={panningModelVariants} />
      <hr />
      <Range label="Position X" value={this._positionX} accuracy={3} />
      <Range label="Position Y" value={this._positionY} accuracy={3} />
      <Range label="Position Z" value={this._positionZ} accuracy={3} />
      <hr />
      <Range label="Ref distance" value={this._refDistance} accuracy={2} />
      <Range label="Max distance" value={this._maxDistance} accuracy={3} />
      <Range label="Rollof Factor" value={this._rolloffFactor} accuracy={3} />

    </>
  );
}