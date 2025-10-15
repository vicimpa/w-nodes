export class LoadEvent extends KeyboardEvent {
  constructor(public loadCode: string) {
    super('keydown', { code: 'KeyV', ctrlKey: true });
  }

  static emit(code: string) {
    dispatchEvent(new this(code));
  }
}