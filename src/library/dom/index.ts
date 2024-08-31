type HTMLS = HTMLElementTagNameMap;
type SVGS = SVGElementTagNameMap;

type PropsKeys<E extends object> = {
  [K in keyof E]: E[K] extends string | number | boolean ? K : never
}[keyof E];

type EventsKeys<E extends object> = {
  [K in keyof E]: K extends `on${string}` ? K : never
}[keyof E];

type Props<E extends object> = {
  [K in PropsKeys<E>]?: E[K]
} & {
  [K in EventsKeys<E>]?: E[K]
} & {
  ref?: (elem: E) => any;
} & (
    E extends { style: any; } ? {
      style?: Partial<E['style']>;
    } : {}
  );

export const dom = <K extends keyof HTMLS>(tag: K, { ref, style, ...props }: Props<HTMLS[K]>, ...children: Element[]) => {
  const elem = document.createElement(tag);
  Object.assign(elem, props);
  Object.assign(elem.style, style);
  children.forEach(_e => elem.appendChild(_e));
  return (ref?.(elem), elem);
};

export const svg = <K extends keyof SVGS>(tag: K, { ref, style, ...props }: Props<SVGS[K]>, ...children: Element[]) => {
  const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.assign(elem, props);
  Object.assign(elem.style, style);
  children.forEach(_e => elem.appendChild(_e));
  return (ref?.(elem), elem);
};

export function selectText(element: HTMLElement) {
  const selection = window.getSelection()!;
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}
