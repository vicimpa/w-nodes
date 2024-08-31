import { NodeProject } from "../NodeProject";
import { Vec2 } from "$library/vec2";
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

export default (ctx: NodeProject) => (
  dispose(
    windowEvents('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key == 'd') {
        e.preventDefault();
        const nodes = [...ctx.selection.select];
        const connect = ctx.saveConnections(...nodes);
        ctx.copy(...nodes)
          .then(select => {
            ctx.selection.select = select;
            select.forEach(e => e.x += 10);
            select.forEach(e => e.y += 10);
            ctx.restoreConnections(connect, ...select);
          });
      }
    }),
    windowEvents('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key == 'c') {
        e.preventDefault();
        const copy = [...ctx.selection.select];
        const nodes = copy.map(e => ctx.nodes.indexOf(ctx.find(e)!));
        const connect = ctx.saveConnections(...copy).filter(e => Array.isArray(e[0]) && Array.isArray(e[1]));
        const configs = copy.map(e => {
          const data = ctx.save(e);
          if ('x' in data && 'y' in data) {
            const _data = data as { x: number, y: number; };
            new Vec2(_data).minus(ctx.map).toObject(_data);
          }
          return data;
        });

        navigator.clipboard.writeText(JSON.stringify({ nodes, connect, configs }));
      }
    }),
    windowEvents('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key == 'v') {
        e.preventDefault();


        navigator.clipboard.readText()
          .then(text => {
            try {
              const { nodes, configs, connect } = v.Parse(copyDTO, JSON.parse(text));

              Promise.all(nodes.map((e) => {
                return ctx.append(ctx.nodes[e]);
              })).then(select => {
                select.forEach((e, i) => {
                  ctx.restore(e, typeof configs[i] === 'object' ? configs[i] : {});
                  new Vec2(e).plus(ctx.map).toObject(e);
                });
                ctx.restoreConnections(connect, ...select);
                ctx.selection.select = select;
              });
            } catch (e) { }
          });
      }
    }),
  )
);