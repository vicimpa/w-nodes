import type Group from "./Group";
import { NodeProject } from "$components/node-editor";
import { TProjectData } from "$components/node-editor/node-project/utils/projectCodec";
import { TSlot } from "./state";
import { signal } from "@preact/signals-react";

export type TSavedBlock = {
  id: string;
  label: string;
  slots: TSlot[];
  graph: TProjectData;
  compiled?: boolean;
};

const key = 'w-nodes:blocks';

const read = (): TSavedBlock[] => {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

// Сохранённые пользователем блоки («Мои блоки» в меню)
export const savedBlocks = signal<TSavedBlock[]>(read());

// Другие вкладки тоже меняют список
addEventListener('storage', e => {
  if (e.key === key)
    savedBlocks.value = read();
});

// Изменение всегда применяем к свежему списку из хранилища, а не к копии этой вкладки
const update = (change: (blocks: TSavedBlock[]) => TSavedBlock[]) => {
  const blocks = change(read());
  savedBlocks.value = blocks;

  try {
    localStorage.setItem(key, JSON.stringify(blocks));
  } catch (e) {
    console.warn('Cannot save the block library', e);
  }
};

const uniqueLabel = (label: string, blocks: TSavedBlock[]) => {
  var result = label;

  for (var i = 2; blocks.some(item => item.label === result); i++)
    result = `${label} ${i}`;

  return result;
};

export function saveBlock(block: Group) {
  update(blocks => [...blocks, {
    id: Math.random().toString(36).slice(2, 10),
    label: uniqueLabel(block.label, blocks),
    slots: structuredClone(block.slots),
    graph: structuredClone(block.graph),
    compiled: block.compiled,
  }]);
}

export function removeBlock(id: string) {
  update(blocks => blocks.filter(item => item.id !== id));
}

export async function placeBlock(project: NodeProject, entry: TSavedBlock, point: { x: number, y: number; }) {
  const type = project.typeById('Group');

  if (!type)
    return;

  const block = await project.append(type, point) as Group;
  block.label = entry.label;
  block.slots = structuredClone(entry.slots);
  block.graph = structuredClone(entry.graph);
  block.compiled = entry.compiled === true;
  project.selection.select = [block];
  return block;
}
