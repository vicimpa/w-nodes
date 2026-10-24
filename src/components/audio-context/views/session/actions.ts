import { NodeProject, TExportPurpose } from "$components/node-editor";

import { AudioProject } from "$components/audio-context/AudioProject";
import type Sampler from "$components/audio-context/nodes/Sampler";
import type { Vec2Point } from "@vicimpa/lib-vec2";
import { encodeProject } from "$components/node-editor/node-project/utils/projectCodec";
import { findExample } from "$components/audio-context/examples";
import { refreshMedia } from "$library/media";
import { signal } from "@preact/signals-react";

const autosaveKey = 'w-nodes:autosave';
const previousKey = 'w-nodes:previous';

// Вкладка, которая последней записала автосохранение
const tabId = Math.random().toString(36).slice(2, 10);

export type TSaved = {
  text: string;
  view: { x: number; y: number; s: number; };
  tab?: string;
};

export const hasPrevious = signal(false);

const storage = {
  read(key: string): TSaved | null {
    try {
      const json = localStorage.getItem(key);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  },
  write(key: string, value: TSaved | null) {
    try {
      if (value)
        localStorage.setItem(key, JSON.stringify({ text: value.text, view: value.view, tab: value.tab }));
      else
        localStorage.removeItem(key);
    } catch (e) {
      console.warn('Cannot write to localStorage', e);
    }
  }
};

const stash = (saved: TSaved | null) => {
  if (!saved)
    return;

  storage.write(previousKey, saved);
  hasPrevious.value = true;
};

export async function snapshot(project: AudioProject, purpose: TExportPurpose = 'autosave') {
  const nodes = project.store.flatMap(item => item.ref.current ?? []);
  const { data } = project.serialize(nodes);
  const { x, y, s } = project.map;
  const { data: exported, skipped } = await project.exportMedia(data, purpose);

  return { text: await encodeProject(exported), view: { x, y, s }, skipped };
}

export async function open(project: AudioProject, saved: TSaved) {
  project.clean();
  Object.assign(project.map, saved.view);
  await load(project, saved.text);
}

async function load(project: AudioProject, text: string) {
  if (text)
    await project.paste(text);

  project.selection.select = [];
}

// Заменяет текущий проект, откладывая его в слот «previous».
export async function replace(project: AudioProject, text: string) {
  stash(await snapshot(project));
  project.clean();
  await load(project, text);
  await autosave(project, true);
}

export async function restorePrevious(project: AudioProject) {
  const previous = storage.read(previousKey);

  if (!previous)
    return;

  stash(await snapshot(project));
  await open(project, previous);
  await autosave(project, true);
}

// Сохраняет проект, если вкладка на виду. Чужое автосохранение (из другой вкладки)
// сначала откладывается в «previous», чтобы вкладки не стирали работу друг друга.
export async function autosave(project: AudioProject, force = false) {
  if (!force && document.visibilityState !== 'visible')
    return;

  const saved = { ...await snapshot(project), tab: tabId };
  const current = storage.read(autosaveKey);

  if (current?.text === saved.text && JSON.stringify(current.view) === JSON.stringify(saved.view))
    return;

  if (!force && current?.tab && current.tab !== tabId && current.text !== saved.text)
    stash(current);

  storage.write(autosaveKey, saved);
}

// Если старт не удался, последняя удачная работа не должна пропасть под пустым проектом
export function preserveAutosave() {
  stash(storage.read(autosaveKey));
}

export const shareLink = (text: string) => (
  `${location.origin}${location.pathname}#p=${encodeURIComponent(text)}`
);

const readHash = () => {
  const hash = location.hash.slice(1);

  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
};

export async function startup(project: AudioProject) {
  refreshMedia();

  const hash = readHash();
  const example = findExample(hash);
  const autosaved = storage.read(autosaveKey);
  const text = hash.startsWith('p=') ? hash.slice(2) : example ? await example() : null;

  if (text === null) {
    hasPrevious.value = !!storage.read(previousKey);

    if (autosaved)
      await open(project, autosaved);

    return;
  }

  stash(autosaved);
  hasPrevious.value = !!storage.read(previousKey);
  history.replaceState(null, '', location.pathname + location.search);
  await load(project, text);
}

// Создаёт Sampler с файлом в точке point (координаты карты)
export async function addSampler(project: NodeProject, media: string, point: Vec2Point) {
  const type = project.typeById('Sampler');

  if (!type)
    return;

  const node = await project.append(type) as Sampler;
  node.x = point.x;
  node.y = point.y;
  node.media = media;
  project.selection.select = [node];
}
