// Формулы PannerNode из спецификации Web Audio — для визуализации, не для обработки звука

export type TDistanceModel = 'linear' | 'inverse' | 'exponential';

export function distanceGain(model: TDistanceModel, distance: number, ref: number, max: number, rolloff: number) {
  if (model === 'linear') {
    if (max <= ref)
      return 1;

    const d = Math.min(Math.max(distance, ref), max);
    return 1 - Math.min(Math.max(rolloff, 0), 1) * (d - ref) / (max - ref);
  }

  if (ref <= 0)
    return distance > 0 ? 0 : 1;

  const d = Math.max(distance, ref);

  if (model === 'inverse')
    return ref / (ref + Math.max(rolloff, 0) * (d - ref));

  return Math.pow(d / ref, -Math.max(rolloff, 0));
}

export type TVec3 = [x: number, y: number, z: number];

const length = ([x, y, z]: TVec3) => Math.hypot(x, y, z);

// Усиление конуса: угол между направлением источника и направлением от источника на слушателя
export function coneGain(inner: number, outer: number, outerGain: number, orientation: TVec3, source: TVec3, listener: TVec3 = [0, 0, 0]) {
  if (!length(orientation) || (inner >= 360 && outer >= 360))
    return 1;

  const toListener: TVec3 = [listener[0] - source[0], listener[1] - source[1], listener[2] - source[2]];
  const distance = length(toListener);

  if (!distance)
    return 1;

  const cos = (orientation[0] * toListener[0] + orientation[1] * toListener[1] + orientation[2] * toListener[2])
    / (length(orientation) * distance);
  const angle = Math.acos(Math.min(Math.max(cos, -1), 1)) * 180 / Math.PI;
  const halfInner = inner / 2;
  const halfOuter = Math.max(outer, inner) / 2;

  if (angle <= halfInner)
    return 1;

  if (angle >= halfOuter)
    return outerGain;

  const t = (angle - halfInner) / (halfOuter - halfInner);
  return 1 + t * (outerGain - 1);
}

// Угол источника относительно слушателя, смотрящего в −Z: 0° — спереди, плюс — справа
export const azimuth = (x: number, z: number) => Math.atan2(x, -z) * 180 / Math.PI;

export const toDecibels = (gain: number) => gain > 0 ? 20 * Math.log10(gain) : -Infinity;

// Ближайшее сверху «круглое» число 1, 2, 5 × 10ⁿ — для масштаба схемы
export function niceCeil(value: number) {
  if (!(value > 0))
    return 1;

  const power = 10 ** Math.floor(Math.log10(value));

  for (const step of [1, 2, 5, 10]) {
    if (value <= step * power)
      return step * power;
  }

  return 10 * power;
}
