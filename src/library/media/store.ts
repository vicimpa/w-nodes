import { hashBytes } from "./refs";
import { signal } from "@preact/signals-react";

export type TMediaInfo = {
  hash: string;
  name: string;
  mime: string;
  size: number;
};

export type TMediaRecord = TMediaInfo & {
  data: ArrayBuffer;
};

const dbName = 'w-nodes-media';
const storeName = 'files';

export const mediaList = signal<TMediaInfo[]>([]);
export const mediaLoaded = signal(false);

// Запасной вариант, если IndexedDB недоступна (приватный режим и т.п.)
const memory = new Map<string, TMediaRecord>();
var database: Promise<IDBDatabase | null> | null = null;

const request = <T>(req: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

function open() {
  return database ??= new Promise<IDBDatabase | null>(resolve => {
    try {
      const req = indexedDB.open(dbName, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(storeName, { keyPath: 'hash' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function files(mode: IDBTransactionMode) {
  const db = await open();
  return db?.transaction(storeName, mode).objectStore(storeName) ?? null;
}

const info = ({ hash, name, mime, size }: TMediaInfo): TMediaInfo => ({ hash, name, mime, size });

export async function refreshMedia() {
  const records = new Map<string, TMediaInfo>();

  memory.forEach(record => records.set(record.hash, info(record)));

  try {
    const store = await files('readonly');

    if (store)
      (await request(store.getAll() as IDBRequest<TMediaRecord[]>))
        .forEach(record => records.set(record.hash, info(record)));
  } catch (e) {
    console.warn('Cannot read media library', e);
  }

  mediaList.value = [...records.values()].sort((a, b) => a.name.localeCompare(b.name));
  mediaLoaded.value = true;
}

export async function getMedia(hash: string): Promise<TMediaRecord | null> {
  const cached = memory.get(hash);

  if (cached)
    return cached;

  try {
    const store = await files('readonly');
    const record = store ? await request(store.get(hash) as IDBRequest<TMediaRecord | undefined>) : undefined;

    if (record)
      memory.set(hash, record);

    return record ?? null;
  } catch {
    return null;
  }
}

export async function putMedia(record: TMediaRecord) {
  memory.set(record.hash, record);

  try {
    const store = await files('readwrite');

    if (store)
      await request(store.put(record));
  } catch (e) {
    console.warn('Cannot store media, keeping it in memory', e);
  }

  await refreshMedia();
  return info(record);
}

export async function addMedia(data: ArrayBuffer, name: string, mime: string) {
  return putMedia({ hash: await hashBytes(data), name, mime, size: data.byteLength, data });
}

export async function removeMedia(hash: string) {
  memory.delete(hash);
  decoded.delete(hash);

  try {
    const store = await files('readwrite');

    if (store)
      await request(store.delete(hash));
  } catch (e) {
    console.warn('Cannot remove media', e);
  }

  await refreshMedia();
}

const decoded = new Map<string, Promise<AudioBuffer | null>>();

export function decodeMedia(hash: string, ctx: BaseAudioContext) {
  var result = decoded.get(hash);

  if (!result) {
    result = getMedia(hash)
      .then(record => record ? ctx.decodeAudioData(record.data.slice(0)) : null)
      .catch(e => {
        console.warn('Cannot decode media', e);
        return null;
      })
      .then(buffer => {
        // Неудачу не кешируем: файл могут добавить позже
        if (!buffer)
          decoded.delete(hash);

        return buffer;
      });

    decoded.set(hash, result);
  }

  return result;
}
