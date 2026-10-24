export const examples = import.meta.glob<string>('./*.txt', { query: '?raw', import: 'default' });

export const exampleName = (path: string) => path.split('/').at(-1) ?? path;

export const findExample = (name: string) => (
  Object.entries(examples).find(([path]) => [name, `${name}.txt`].includes(exampleName(path)))?.[1]
);
