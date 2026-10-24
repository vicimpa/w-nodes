const cache = new WeakMap<Element, string>();

// Цвет категории ноды (--accent) для рисования на canvas
export const accentOf = (elem: Element, alpha = 1) => {
  var color = cache.get(elem);

  if (!color) {
    color = getComputedStyle(elem).getPropertyValue('--accent').trim() || '#ffffff';

    if (elem.isConnected)
      cache.set(elem, color);
  }

  if (alpha >= 1 || !/^#[0-9a-f]{6}$/i.test(color))
    return color;

  return color + Math.round(alpha * 255).toString(16).padStart(2, '0');
};
