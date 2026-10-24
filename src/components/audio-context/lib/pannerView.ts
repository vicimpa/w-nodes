import { TDistanceModel, TVec3, azimuth, coneGain, distanceGain, toDecibels } from "$library/spatial";

import { accentOf } from "./accent";

// Состояние Panner, которое нужно для схемы: всё в метрах и градусах
export type TPannerState = {
  position: TVec3;
  orientation: TVec3;
  inner: number;
  outer: number;
  outerGain: number;
  model: TDistanceModel;
  ref: number;
  max: number;
  rolloff: number;
  // Радиус видимой области сцены
  radius: number;
};

export const SCENE = { width: 300, height: 220, margin: 14, arrow: 40 };
export const CURVE = { width: 300, height: 84, pad: 8 };

const FONT = '10px "Fira Sans Condensed", system-ui, sans-serif';
const TEXT = '#e6e6e6';
const MUTED = '#7e7e7e';
const HEAT_CELL = 5;

export const formatMeters = (value: number) => (
  value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)
);

export const formatDecibels = (gain: number) => {
  const db = toDecibels(gain);
  return Number.isFinite(db) ? `${db > 0 ? '+' : ''}${db.toFixed(1)} dB` : '−∞ dB';
};

export const totalGain = (state: TPannerState, position = state.position) => (
  distanceGain(state.model, Math.hypot(...position), state.ref, state.max, state.rolloff) *
  coneGain(state.inner, state.outer, state.outerGain, state.orientation, position)
);

// Пиксели на метр и центр сцены (слушатель)
export const sceneFrame = (radius: number) => ({
  cx: SCENE.width / 2,
  cy: SCENE.height / 2,
  scale: (Math.min(SCENE.width, SCENE.height) / 2 - SCENE.margin) / radius,
});

// Направление источника на плоскости XZ, нормированное; null — смотрит строго вверх или вниз
export const flatDirection = ([x, , z]: TVec3) => {
  const length = Math.hypot(x, z);
  return length > 1e-6 ? { x: x / length, z: z / length } : null;
};

export const arrowTip = (state: TPannerState) => {
  const { cx, cy, scale } = sceneFrame(state.radius);
  const dir = flatDirection(state.orientation);
  const sx = cx + state.position[0] * scale;
  const sy = cy + state.position[2] * scale;

  return dir ? { x: sx + dir.x * SCENE.arrow, y: sy + dir.z * SCENE.arrow } : null;
};

const rgb = (color: string) => {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(color);
  return match ? match.slice(1).map(part => parseInt(part, 16)) : [255, 255, 255];
};

// Тепловая карта: какое усиление получит слушатель, если поставить источник в эту точку
const heatCache = new WeakMap<HTMLCanvasElement, { key: string, image: HTMLCanvasElement; }>();

const heatmap = (can: HTMLCanvasElement, state: TPannerState) => {
  const accent = accentOf(can);
  const { position, orientation, inner, outer, outerGain, model, ref, max, rolloff, radius } = state;
  const key = [accent, position[1], ...orientation, inner, outer, outerGain, model, ref, max, rolloff, radius].join();
  const cached = heatCache.get(can);

  if (cached?.key === key)
    return cached.image;

  const columns = Math.ceil(SCENE.width / HEAT_CELL);
  const rows = Math.ceil(SCENE.height / HEAT_CELL);
  const image = cached?.image ?? document.createElement('canvas');
  image.width = columns;
  image.height = rows;

  const draw = image.getContext('2d')!;
  const data = draw.createImageData(columns, rows);
  const [r, g, b] = rgb(accent);
  const { cx, cy, scale } = sceneFrame(radius);

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = ((column + .5) * HEAT_CELL - cx) / scale;
      const z = ((row + .5) * HEAT_CELL - cy) / scale;
      const gain = totalGain(state, [x, position[1], z]);
      const index = (row * columns + column) * 4;

      data.data[index] = r;
      data.data[index + 1] = g;
      data.data[index + 2] = b;
      data.data[index + 3] = Math.sqrt(Math.min(Math.max(gain, 0), 1)) * 80;
    }
  }

  draw.putImageData(data, 0, 0);
  heatCache.set(can, { key, image });
  return image;
};

const prepare = (ctx: CanvasRenderingContext2D, can: HTMLCanvasElement, width: number) => {
  const dpr = can.width / width;
  ctx.resetTransform();
  ctx.clearRect(0, 0, can.width, can.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.setLineDash([]);
  ctx.font = FONT;
};

const ring = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
};

const sector = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, angle: number, width: number) => {
  ctx.beginPath();

  if (width >= 360) {
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  } else {
    const half = width / 2 * Math.PI / 180;
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, angle - half, angle + half);
    ctx.closePath();
  }

  ctx.fill();
};

// Вид сверху: слушатель в центре смотрит вверх (−Z), X — вправо
export function drawScene(ctx: CanvasRenderingContext2D, can: HTMLCanvasElement, state: TPannerState) {
  const { width, height, arrow } = SCENE;
  const { cx, cy, scale } = sceneFrame(state.radius);
  const accent = accentOf(can);
  const [px, py, pz] = state.position;
  const sx = cx + px * scale;
  const sy = cy + pz * scale;

  prepare(ctx, can, width);

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(heatmap(can, state), 0, 0, width, height);

  // Сетка: кольца по четверти радиуса и оси
  ctx.strokeStyle = 'rgba(255, 255, 255, .06)';
  ctx.lineWidth = 1;

  for (let i = 1; i <= 4; i++)
    ring(ctx, cx, cy, state.radius * scale * i / 4);

  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, height);
  ctx.moveTo(0, cy);
  ctx.lineTo(width, cy);
  ctx.stroke();

  ctx.fillStyle = MUTED;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`${formatMeters(state.radius)} m`, cx + state.radius * scale + 3, cy + 3);

  // Кольца ref и max distance
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;

  const rings: [value: number, label: string, alpha: number][] = [
    [state.ref, 'ref', .7],
    [state.max, 'max', .4],
  ];

  for (const [value, label, alpha] of rings) {
    const r = value * scale;

    if (r < 2 || r > Math.hypot(width, height) / 2)
      continue;

    ctx.strokeStyle = accentOf(can, alpha);
    ring(ctx, cx, cy, r);
    ctx.fillStyle = accentOf(can, alpha);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, cx + r * Math.SQRT1_2 + 2, cy - r * Math.SQRT1_2 - 1);
  }

  // Линия от слушателя к источнику
  ctx.strokeStyle = 'rgba(255, 255, 255, .25)';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(sx, sy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Конус источника: внутренний ярче, внешний бледнее
  const dir = flatDirection(state.orientation);

  // Всенаправленный источник (оба угла 360°) конуса не имеет
  if (dir && Math.min(state.inner, state.outer) < 360) {
    const angle = Math.atan2(dir.z, dir.x);
    ctx.fillStyle = accentOf(can, .14);
    sector(ctx, sx, sy, arrow + 8, angle, Math.max(state.outer, state.inner));
    ctx.fillStyle = accentOf(can, .3);
    sector(ctx, sx, sy, arrow + 8, angle, state.inner);
  }

  // Слушатель: голова, нос и уши
  ctx.fillStyle = TEXT;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 7);
  ctx.lineTo(cx, cy - 13);
  ctx.lineTo(cx + 4, cy - 7);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - 8.5, cy, 2, 3.5, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 8.5, cy, 2, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();

  // Стрелка направления с ручкой
  if (dir) {
    const tx = sx + dir.x * arrow;
    const ty = sy + dir.z * arrow;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.fillStyle = '#181818';
    ctx.beginPath();
    ctx.arc(tx, ty, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Смотрит вверх или вниз — кольцо вокруг источника
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ring(ctx, sx, sy, 11);
  }

  // Источник
  ctx.fillStyle = accent;
  ctx.strokeStyle = '#181818';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sx, sy, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (Math.abs(py) >= .005) {
    ctx.fillStyle = TEXT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`y ${py > 0 ? '+' : '−'}${formatMeters(Math.abs(py))}`, sx + 10, sy - 10);
  }

  // Сводка: расстояние, азимут, итоговое усиление
  const distance = Math.hypot(px, py, pz);
  const az = distance > 1e-6 ? Math.round(azimuth(px, pz)) : 0;
  ctx.fillStyle = TEXT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${formatMeters(distance)} m · ${az > 0 ? '+' : ''}${az}° · ${formatDecibels(totalGain(state))}`, 6, height - 5);

  ctx.fillStyle = MUTED;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('front', cx, 4);
}

// Усиление от расстояния для текущей модели и отметка текущего расстояния
export function drawCurve(ctx: CanvasRenderingContext2D, can: HTMLCanvasElement, state: TPannerState) {
  const { width, height, pad } = CURVE;
  const top = pad + 12;
  const bottom = height - pad;
  const span = Math.max(state.radius, state.ref * 2);
  const toX = (d: number) => pad + d / span * (width - pad * 2);
  const toY = (gain: number) => bottom - Math.min(Math.max(gain, 0), 1) * (bottom - top);
  const gainAt = (d: number) => distanceGain(state.model, d, state.ref, state.max, state.rolloff);

  prepare(ctx, can, width);

  // Уровни 0, −6, −12 дБ
  ctx.strokeStyle = 'rgba(255, 255, 255, .06)';
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (const gain of [1, .5, .25]) {
    ctx.moveTo(pad, Math.round(toY(gain)) + .5);
    ctx.lineTo(width - pad, Math.round(toY(gain)) + .5);
  }

  ctx.stroke();

  const steps = 120;
  const path = new Path2D();

  for (let i = 0; i <= steps; i++) {
    const d = span * i / steps;
    const x = toX(d);
    const y = toY(gainAt(d));
    i ? path.lineTo(x, y) : path.moveTo(x, y);
  }

  const fill = new Path2D(path);
  fill.lineTo(toX(span), bottom);
  fill.lineTo(toX(0), bottom);
  fill.closePath();
  ctx.fillStyle = accentOf(can, .15);
  ctx.fill(fill);
  ctx.strokeStyle = accentOf(can);
  ctx.lineWidth = 2;
  ctx.stroke(path);

  // ref distance
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = accentOf(can, .6);
  ctx.beginPath();
  ctx.moveTo(toX(state.ref), top);
  ctx.lineTo(toX(state.ref), bottom);
  ctx.stroke();
  ctx.setLineDash([]);

  // Текущее расстояние
  const distance = Math.hypot(...state.position);
  const mx = toX(Math.min(distance, span));
  const my = toY(gainAt(distance));
  ctx.strokeStyle = 'rgba(255, 255, 255, .35)';
  ctx.beginPath();
  ctx.moveTo(mx, top);
  ctx.lineTo(mx, bottom);
  ctx.stroke();
  ctx.fillStyle = TEXT;
  ctx.strokeStyle = '#181818';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mx, my, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.textBaseline = 'top';
  ctx.fillStyle = MUTED;
  ctx.textAlign = 'left';
  ctx.fillText(`${state.model} · rolloff ${+state.rolloff.toFixed(2)}`, pad, 3);
  ctx.fillStyle = TEXT;
  ctx.textAlign = 'right';
  ctx.fillText(formatDecibels(gainAt(distance)), width - pad, 3);
  ctx.fillStyle = MUTED;
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${formatMeters(span)} m`, width - pad, bottom - 2);
}
