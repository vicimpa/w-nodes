import { BaseNode } from "./lib/BaseNode";

export const groups = {
  'input': 'Input/Source',
  'output': 'Output/Destination',
  'analyze': 'Analyze/Test/Show',
  'controll': 'Controll/Value',
  'base': 'Default/Base/Effect',
  'custom': 'Custom/Worklet',
  'ungroup': 'Ungroup/Other',
} as const;

const keys = Object.keys(groups);

const symbol = Symbol('group');

export const groupIndex = (group: keyof typeof groups) => keys.indexOf(group);

export const group = (group: keyof typeof groups) => {
  return <T extends typeof BaseNode>(target: T) => {
    (target as any)[symbol] = group;
  };
};

export const getGroup = <T extends typeof BaseNode>(target: T): keyof typeof groups => {
  return (target as any)[symbol] ?? 'ungroup';
};
