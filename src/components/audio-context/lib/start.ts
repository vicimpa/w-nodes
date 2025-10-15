import { ctx } from "../ctx";

export interface Startable {
  start?(n?: number): any;
  end?(): any;
  stop?(): any;
}

export const start = <T extends Startable>(target?: T) => {
  var dispose = target?.start?.(ctx.currentTime);
  return () => {
    dispose instanceof Function && dispose();
    target?.stop?.();
    target?.end?.();
  };
};