export type TMidiInput = {
  id: string;
  name: string;
};

// id портов разные на разных машинах, поэтому при промахе ищем по имени
export const findInput = (list: TMidiInput[], id: string, name?: string) => (
  list.find(input => input.id === id) ??
  (name ? list.find(input => input.name === name) : undefined)
);
