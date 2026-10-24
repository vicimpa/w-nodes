import type { NodeProject } from "$components/node-editor";
import { signal } from "@preact/signals-react";

export type TSlot = {
  id: string;
  kind: 'in' | 'out';
  label: string;
};

export interface IBlock {
  label: string;
  inner: NodeProject | null;
  opened: boolean;
  close(): void;
}

// Открытые на редактирование блоки, от внешнего к внутреннему
export const openBlocks = signal<IBlock[]>([]);

// Проект, в который сейчас добавляются ноды: самый внутренний открытый блок или корень
export const activeProject = <T extends NodeProject>(root: T): NodeProject => (
  openBlocks.value.at(-1)?.inner ?? root
);

export const slotId = () => Math.random().toString(36).slice(2, 10);
