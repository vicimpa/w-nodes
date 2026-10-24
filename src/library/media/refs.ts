const prefix = 'local:';

export const mediaRef = (hash: string) => prefix + hash;

export const parseMediaRef = (ref: unknown) => (
  typeof ref === 'string' && ref.startsWith(prefix) ? ref.slice(prefix.length) : null
);

// Все медиа, на которые ссылаются сохранённые поля нод (в том числе внутри массивов и объектов)
export function collectMediaRefs(values: unknown[]) {
  const hashes = new Set<string>();

  const visit = (value: unknown) => {
    const hash = parseMediaRef(value);

    if (hash)
      hashes.add(hash);
    else if (Array.isArray(value))
      value.forEach(visit);
    else if (value instanceof Map)
      value.forEach(visit);
    else if (value && typeof value === 'object')
      Object.values(value).forEach(visit);
  };

  values.forEach(visit);
  return hashes;
}

export async function hashBytes(data: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export const formatSize = (bytes: number) => (
  bytes < 1024 ? `${bytes} B` :
    bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` :
      `${(bytes / 1024 ** 2).toFixed(1)} MB`
);
