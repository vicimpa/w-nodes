import { NodeProject, TConnect } from "../NodeProject";
import { makePack, t } from "$library/datapack";

import { Vec2 } from "$library/vec2";
import base64 from "$library/base64";
import { delay } from "$library/function";
import { dispose } from "$library/dispose";
import gzip from "$library/gzip";
import { windowEvents } from "$library/events";

const copyPack = makePack(
  t.obj({
    nodes: t.array(t.uint()),
    connect: t.array(
      t.tuple(
        t.tuple(t.int(), t.int()),
        t.tuple(t.int(), t.int()),
      )
    ),
    configs: t.array(t.map())
  })
);

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
        const connectsStore = connect
          .filter(e => Array.isArray(e[0]) && Array.isArray(e[1])) as [[a: number, b: number], [c: number, d: number]][];

        store = { nodes, connect, configs };

        Promise.resolve()
          .then(() => copyPack.write({
            nodes,
            configs,
            connect: connectsStore
          }))
          .then(buff => gzip.encode(buff))
          .then(buff => base64.encode(buff))
          .then(base64 => navigator.clipboard.writeText(storeString = base64));
      }
    }),
    windowEvents('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.code == 'KeyV') {
        e.preventDefault();

        navigator.clipboard.readText()
          .then(text => (
            store && text === storeString ? (
              store
            ) : (
              Promise.resolve(text)
                .then((text) => base64.decode(text))
                .then(buff => gzip.decode(buff))
                .then(buff => copyPack.read(buff))
            )
          ))
          .then(({ nodes, configs, connect }) => (
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
            })
          ));
      }
    }),
  )
);