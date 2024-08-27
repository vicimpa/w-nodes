import { Component, Context, createContext } from "react";

export const contextSym = Symbol('context');
export const contextMap = new Map<string, Context<any>>();
export const getContext = (target: typeof Component) => {
  var ctx: Context<any> = contextMap.get(target.name) ?? (
    contextMap.set(target.name, ctx = createContext<any>(null)),
    ctx
  );

  return ctx;
};