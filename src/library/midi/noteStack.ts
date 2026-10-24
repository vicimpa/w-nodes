export type TNote = {
  note: number;
  velocity: number;
};

// Моно, приоритет последней ноты: отпустили верхнюю — звучит предыдущая зажатая
export class NoteStack {
  notes: TNote[] = [];

  get top(): TNote | undefined {
    return this.notes.at(-1);
  }

  get size() {
    return this.notes.length;
  }

  press(note: number, velocity: number) {
    this.notes = [...this.notes.filter(e => e.note !== note), { note, velocity }];
    return this.top;
  }

  release(note: number) {
    this.notes = this.notes.filter(e => e.note !== note);
    return this.top;
  }

  clear() {
    this.notes = [];
  }
}
