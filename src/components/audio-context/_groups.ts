import type { BaseNode } from "./lib/BaseNode";
import { LucideIcon } from "lucide-react";

export const groups = {
  'io': { label: 'Input / Output', color: '#7DFFCB' },
  'control': { label: 'Controls', color: '#90C558' },
  'time': { label: 'Time', color: '#DAAFD4' },
  'sequence': { label: 'Sequencing & Routing', color: '#B09AEF' },
  'effect': { label: 'Effects', color: '#8DB5FF' },
  'math': { label: 'Math & Memory', color: '#FF9F63' },
  'monitor': { label: 'Monitors', color: '#FF8282' },
  'block': { label: 'Blocks', color: '#E0E0E0' },
  'misc': { label: 'Other', color: '#A0A0A0' },
} as const;

export type GroupKey = keyof typeof groups;

const keys = Object.keys(groups);

const groupSymbol = Symbol('group');
const iconSymbol = Symbol('icon');

export const groupIndex = (group: GroupKey) => keys.indexOf(group);

export const group = (group: GroupKey) => {
  return <T extends typeof BaseNode>(target: T) => {
    (target as any)[groupSymbol] = group;
  };
};

export const getGroup = (target: Function): GroupKey => {
  return (target as any)[groupSymbol] ?? 'misc';
};

export const groupColor = (target: Function) => groups[getGroup(target)].color;

export const icon = (icon: LucideIcon) => {
  return <T extends typeof BaseNode>(target: T) => {
    (target as any)[iconSymbol] = icon;
  };
};

export const getIcon = (target: Function): LucideIcon | undefined => {
  return (target as any)[iconSymbol];
};
