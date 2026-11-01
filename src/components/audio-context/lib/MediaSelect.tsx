import { addMedia, mediaList, mediaRef, parseMediaRef } from "$library/media";

import { FolderOpen } from "lucide-react";
import { Row } from "./Row";
import { SelectControl } from "./Select";
import { dom } from "$library/dom";
import s from "../styles.module.sass";
import { useComputed } from "@preact/signals-react";

const audioExtensions = /\.(wav|mp3|ogg|oga|opus|flac|m4a|aac|webm)$/i;

export const isAudioFile = (file: File) => file.type.startsWith('audio/') || audioExtensions.test(file.name);

export async function importAudio(file: File) {
  return mediaRef((await addMedia(await file.arrayBuffer(), file.name, file.type || 'audio/*')).hash);
}

export const pickAudio = () => new Promise<File | null>(resolve => {
  dom('input', {
    type: 'file',
    accept: 'audio/*',
    onchange: e => resolve((e.target as HTMLInputElement).files?.[0] ?? null),
  }).click();
});

export type TMediaSelectProps = {
  label?: string;
  get: () => string;
  set: (ref: string) => void;
};

// Выбор файла из медиатеки или загрузка нового
export const MediaSelect = ({ label = 'File', get, set }: TMediaSelectProps) => {
  const select = useComputed(() => {
    const ref = get();
    const hash = parseMediaRef(ref);
    const item = mediaList.value.find(item => item.hash === hash);

    const variants = [
      { value: '', label: '— none —' },
      ...(ref && !item ? [{ value: ref, label: 'Missing file' }] : []),
      ...mediaList.value.map(item => ({ value: mediaRef(item.hash), label: item.name })),
    ];

    return (
      <SelectControl
        label={label}
        value={ref}
        variants={variants}
        change={set}
        shrink
      />
    );
  });

  return (
    <Row label={label}>
      <div className={s.field}>
        {select}
        <button
          title="Load an audio file"
          style={{ border: 'none', padding: 0, background: 'none', display: 'grid' }}
          onClick={async e => {
            e.currentTarget.blur();
            const file = await pickAudio();

            if (file && isAudioFile(file))
              set(await importAudio(file));
          }}
        >
          <FolderOpen size={13} />
        </button>
      </div>
    </Row>
  );
};
