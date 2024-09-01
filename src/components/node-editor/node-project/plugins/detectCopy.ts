import { NodeProject, TConnect } from "../NodeProject";

import { Vec2 } from "$library/vec2";
import { delay } from "$library/function";
import { dispose } from "$library/dispose";
import { Type as t } from '@sinclair/typebox';
import { Value as v } from "@sinclair/typebox/value";
import { windowEvents } from "$library/events";

const copyDTO = t.Object({
  nodes: t.Array(
    t.Integer()
  ),
  connect: t.Array(
    t.Tuple([
      t.Tuple([t.Integer(), t.Integer()]),
      t.Tuple([t.Integer(), t.Integer()]),
    ])
  ),
  configs: t.Array(
    t.Any()
  )
});

var store: { nodes: number[], connect: TConnect[], configs: any[]; } | null = null;
var storeString: string = '';

export default (ctx: NodeProject) => (
  dispose(
    windowEvents('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.code == 'KeyD') {
        e.preventDefault();
        const nodes = [...ctx.selection.select];
        const connect = ctx.saveConnections(...nodes);
        ctx.copy(...nodes)
          .then(async select => {
            ctx.selection.select = select;
            select.forEach(e => e.x += 10);
            select.forEach(e => e.y += 10);
            await delay();
            ctx.restoreConnections(connect, ...select);
          });
      }
    }),
    windowEvents('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.code == 'KeyC') {
        e.preventDefault();
        const copy = [...ctx.selection.select];
        const nodes = copy.map(e => ctx.nodes.indexOf(ctx.find(e)!));
        const connect = ctx.saveConnections(...copy);
        const configs = copy.map(e => {
          const data = ctx.save(e);
          if ('x' in data && 'y' in data) {
            const _data = data as { x: number, y: number; };
            new Vec2(_data).minus(ctx.map).plus(10).toObject(_data);
          }
          return data;
        });

        store = { nodes, connect, configs };
        storeString = btoa(JSON.stringify({
          nodes,
          configs,
          connect: connect
            .filter(e => Array.isArray(e[0]) && Array.isArray(e[1]))
        }));
        navigator.clipboard.writeText(storeString);
      }
    }),
    windowEvents('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.code == 'KeyV') {
        e.preventDefault();

        navigator.clipboard.readText()
          .then(text => {
            try {
              const { nodes = [], configs = [], connect = [] } = text === storeString ? (
                store ?? {}
              ) : v.Parse(copyDTO, JSON.parse(atob(text)));

              Promise.all(nodes.map((e) => {
                return ctx.append(ctx.nodes[e]);
              })).then(async select => {
                select.forEach((e, i) => {
                  ctx.restore(e, typeof configs[i] === 'object' ? configs[i] : {});
                  new Vec2(e).plus(ctx.map).toObject(e);
                });
                ctx.selection.select = select;
                await delay();
                ctx.restoreConnections(connect, ...select);
              });
            } catch (e) { }
          });
      }
    }),
  )
);