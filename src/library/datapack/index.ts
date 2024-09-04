import { TypeContext, TypeStruct, TypeValue } from "./lib/defineType";

import { DataBuffer } from "$library/proto";
import lit from "./types/lit";
import { types as t } from "./types";
import uint from "./types/uint";

export { types } from "./types";
export { t };

const getAllSchema = <T extends TypeStruct>(schema: T): TypeStruct[] => {
  return ([schema] as TypeStruct[])
    .concat(...schema.depends?.map(getAllSchema) ?? []);
};

const sizes = [lit(0), uint(8), uint(16), uint(32)];
const getSize = (n: number) => sizes.findIndex(e => e.equal(n));
const greds = [null, 8, 16, 32] as const;

export const makePack = <T extends TypeStruct>(schema: T) => {
  const schemas = [...new Set(getAllSchema(schema))];
  const databuffer = new DataBuffer();

  const initial = <T extends TypeStruct>(schema: T) => {
    return schema.initial instanceof Function ? (
      schema.initial()
    ) : schema.initial;
  };

  const contextWith = <T extends TypeStruct, S extends Map<TypeStruct, any>>(target: T, _store: S): TypeContext => {
    const store = _store.get(target);

    return {
      store,
      write<T extends TypeStruct>(schema: T, value: TypeValue<T>) {
        schema.write.call(contextWith(schema, _store), value);
      },
      read<T extends TypeStruct>(schema: T): TypeValue<T> {
        return schema.read.call(contextWith(schema, _store));
      }
    };
  };

  return {
    write(data: TypeValue<T>): ArrayBuffer {
      const store = new Map<TypeStruct, any>();
      databuffer.reset();

      for (const schema of schemas)
        store.set(schema, initial(schema));

      schema.write.call(contextWith(schema, store), data);

      for (const schema of schemas) {
        if (!schema.store) continue;
        const { store: currentStore } = contextWith(schema, store);
        var buffer = schema.store.write(currentStore);
        var size = getSize(buffer.byteLength);
        var gred = greds[size];

        databuffer.writeuint8(size);

        if (!gred) continue;

        databuffer[`writeint${gred}`](buffer.byteLength);
        databuffer.write(buffer);
      }

      return databuffer.buffer;
    },
    read(data: ArrayBuffer): TypeValue<T> {
      const store = new Map<TypeStruct, any>();
      databuffer.reset();
      databuffer.write(data);
      databuffer.cursor = 0;

      for (const schema of schemas) {
        if (store.has(schema)) continue;
        if (!schema.store) continue;
        store.set(schema, initial(schema));

        var gred = greds[getSize(databuffer.readuint8())];

        if (!gred) continue;

        store.set(schema, Object.assign(
          initial(schema),
          schema.store.read(
            databuffer.read(undefined, databuffer[`readuint${gred}`]())
          )
        ));
      }

      return schema.read.call(contextWith(schema, store));
    },
    equal(data: any) {
      return schema.equal(data);
    }
  };
};