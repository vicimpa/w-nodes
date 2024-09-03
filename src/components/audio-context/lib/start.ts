export interface Startable {
  start?(): any;
  end?(): any;
}

export const start = <T extends Startable>(target?: T) => {
  var dispose = target?.start?.();
  return () => {
    dispose instanceof Function && dispose();
    target?.end?.();
  };
};