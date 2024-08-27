import { Component, ReactNode, useEffect } from "react";

export type TMixin<T> = (target: T) => void | (() => void);

const Connect = <T,>(props: { plugins: TMixin<T>[], target: T; }) => {
  const { plugins, target } = props;

  useEffect(() => {
    const dispose = plugins.map(plugin => plugin(target));
    return () => dispose.forEach(d => d && d());;
  }, []);

  return null;
};

export const connect = <
  I extends Component,
>(...plugins: TMixin<I>[]) => {
  return (target: new (...args: any[]) => I) => {
    return {
      [target.name]: (
        class extends (target as typeof Component) {
          render(this: I): ReactNode {
            return (
              <>
                <Connect plugins={plugins} target={this} />
                {super.render()}
              </>
            );
          }
        } as new (...args: any[]) => I
      )
    }[target.name];
  };
};