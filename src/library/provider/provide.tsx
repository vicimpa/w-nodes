import { Component, ReactNode } from "react";

import { getContext } from "./context";

export const provide = <T extends Component>() => {
  return (target: new (...args: any[]) => T) => {
    const ctx = getContext(target);

    return (
      {
        [target.name]: (
          class extends (target as typeof Component) {
            render(this: T): ReactNode {
              return (
                <ctx.Provider value={this}>
                  {super.render()}
                </ctx.Provider>
              );
            }
          } as any as (new (...args: any[]) => T)
        )
      }[target.name]
    );
  };
};