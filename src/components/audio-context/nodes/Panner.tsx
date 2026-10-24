import { CURVE, SCENE, TPannerState, arrowTip, drawCurve, drawScene, sceneFrame } from "../lib/pannerView";
import { computed, signal } from "@preact/signals-react";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { Canvas } from "$components/canvas";
import { Range } from "../lib/Range";
import { Select } from "../lib/Select";
import { SignalNode } from "../lib/signalNode";
import { ctx } from "../ctx";
import { dispose } from "$library/dispose";
import { group, icon } from "../_groups";
import { Orbit } from "lucide-react";
import { makeDrag } from "@vicimpa/easy-drag";
import { name } from "$library/function";
import { niceCeil } from "$library/spatial";
import { store } from "$components/node-editor";
import { refValue } from "../lib/refValue";
import s from "../styles.module.sass";

const distanceModels = ['linear', 'inverse', 'exponential'] as const;
const panningModels = ['equalpower', 'HRTF'] as const;

const distanceModelVariants = distanceModels.map((value) => ({ value }));
const panningModelVariants = panningModels.map((value) => ({ value }));

const dpr = () => Math.min(Math.max(Math.ceil(devicePixelRatio || 1), 1), 3);

// Точка курсора в логических координатах сцены (нода может быть отмасштабирована камерой)
const scenePoint = (can: HTMLCanvasElement, point: { x: number, y: number; }) => {
  const rect = can.getBoundingClientRect();
  return {
    x: (point.x - rect.left) / rect.width * SCENE.width,
    y: (point.y - rect.top) / rect.height * SCENE.height,
  };
};

type TDragMode = 'position' | 'orientation';

const drag = makeDrag<[can: HTMLCanvasElement, node: Panner, mode: TDragMode]>((event, can, node, mode) => {
  // Масштаб сцены держим, пока тянем, иначе точка уезжает из-под курсора
  node._hold.value = node._radius.peek();

  const move = ({ current }: { current: { x: number, y: number; }; }) => {
    const { cx, cy, scale } = sceneFrame(node._hold.peek());
    const point = scenePoint(can, current);
    const x = Math.min(Math.max(point.x, 0), SCENE.width);
    const y = Math.min(Math.max(point.y, 0), SCENE.height);

    if (mode === 'position') {
      node._positionX.value = (x - cx) / scale;
      node._positionZ.value = (y - cy) / scale;
      return;
    }

    const dx = x - (cx + node._positionX.peek() * scale);
    const dz = y - (cy + node._positionZ.peek() * scale);
    const length = Math.hypot(dx, dz);

    if (length < 1)
      return;

    // Сохраняем длину горизонтальной части направления и наклон по Y
    const flat = Math.hypot(node._orientationX.peek(), node._orientationZ.peek()) || 1;
    node._orientationX.value = dx / length * flat;
    node._orientationZ.value = dz / length * flat;
  };

  if (mode === 'position')
    move(event);

  return (event) => {
    move(event);
    return () => { node._hold.value = 0; };
  };
}, 0);

@name('Panner')
@group('effect')
@icon(Orbit)
export default class Panner extends BaseNode {
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

  // Радиус сцены, зафиксированный на время перетаскивания (0 — подбирать автоматически)
  _hold = signal(0);

  _radius = computed(() => (
    this._hold.value || niceCeil(Math.max(
      2,
      Math.hypot(this._positionX.value, this._positionZ.value) * 1.25,
      this._refDistance.value * 1.5,
    ))
  ));

  _state = computed((): TPannerState => ({
    position: [this._positionX.value, this._positionY.value, this._positionZ.value],
    orientation: [this._orientationX.value, this._orientationY.value, this._orientationZ.value],
    inner: this._innerAngle.value,
    outer: this._outerAngle.value,
    outerGain: this._outerGain.value,
    model: this._distanceModel.value,
    ref: this._refDistance.value,
    max: this._maxDistance.value,
    rolloff: this._rolloffFactor.value,
    radius: this._radius.value,
  }));

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

  #pick(can: HTMLCanvasElement, event: React.MouseEvent): TDragMode | null {
    const point = scenePoint(can, { x: event.clientX, y: event.clientY });
    const tip = arrowTip(this._state.peek());
    const orientationFree = !this._orientationX.connected && !this._orientationZ.connected;
    const positionFree = !this._positionX.connected && !this._positionZ.connected;

    if (tip && orientationFree && Math.hypot(point.x - tip.x, point.y - tip.y) <= 9)
      return 'orientation';

    return positionFree ? 'position' : null;
  }

  _view = () => (
    <>
      <div style={{ width: 300 }} />
      <Canvas
        width={SCENE.width * dpr()}
        height={SCENE.height * dpr()}
        style={{ width: SCENE.width, height: SCENE.height, cursor: 'crosshair' }}
        onContextMenu={(event) => {
          event.preventDefault();

          if (this._positionX.connected || this._positionZ.connected)
            return;

          this._positionX.value = this._positionX.default;
          this._positionZ.value = this._positionZ.default;
        }}
        onMouseDown={(event) => {
          if (event.button !== 0)
            return;

          const mode = this.#pick(event.currentTarget, event);

          if (!mode)
            return;

          event.stopPropagation();
          drag(event, event.currentTarget, this, mode);
        }}
        draw={(ctx, can) => drawScene(ctx, can, this._state.value)} />
      <Canvas
        width={CURVE.width * dpr()}
        height={CURVE.height * dpr()}
        style={{ width: CURVE.width, height: CURVE.height }}
        draw={(ctx, can) => drawCurve(ctx, can, this._state.value)} />

      <div className={s.caption}>Cone</div>
      <Range label="Inner angle" value={this._innerAngle} accuracy={1} postfix="°" />
      <Range label="Outer angle" value={this._outerAngle} accuracy={1} postfix="°" />
      <Range label="Outer gain" value={this._outerGain} accuracy={3} />
      <div className={s.caption}>Models</div>
      <Select label="Distance" value={this._distanceModel} variants={distanceModelVariants} />
      <Select label="Panning" value={this._panningModel} variants={panningModelVariants} />
      <div className={s.caption}>Orientation</div>
      <Range label="X" value={this._orientationX} accuracy={3} />
      <Range label="Y" value={this._orientationY} accuracy={3} />
      <Range label="Z" value={this._orientationZ} accuracy={3} />
      <div className={s.caption}>Position</div>
      <Range label="X" value={this._positionX} accuracy={3} postfix="m" />
      <Range label="Y" value={this._positionY} accuracy={3} postfix="m" />
      <Range label="Z" value={this._positionZ} accuracy={3} postfix="m" />
      <div className={s.caption}>Falloff</div>
      <Range label="Ref" value={this._refDistance} accuracy={2} postfix="m" />
      <Range label="Max" value={this._maxDistance} accuracy={0} postfix="m" />
      <Range label="Rolloff" value={this._rolloffFactor} accuracy={3} />
    </>
  );
}
