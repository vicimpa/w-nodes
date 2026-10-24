import { addWorkletModule, nextProcessorName } from "./defineWorklet";

const cache = new Map<string, Promise<string>>();

// Регистрирует процессор во время работы. `build` получает имя процессора и должен вернуть
// доверенный исходник (из генератора кода, не из пользовательского текста).
// Одинаковый `key` — один и тот же процессор.
export const defineRuntimeWorklet = (key: string, build: (name: string) => string) => {
  var processor = cache.get(key);

  if (!processor) {
    const name = nextProcessorName('RuntimeWorklet');
    processor = addWorkletModule(build(name)).then(() => name);
    processor.catch(() => cache.delete(key));
    cache.set(key, processor);
  }

  return processor;
};
