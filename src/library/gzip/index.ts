// Прогоняет байты через поток (де)компрессии.
// Node 22 принимает в такой поток только типизированный массив, а не голый ArrayBuffer;
// ошибка записи должна всплыть, а не оставить чтение висеть.
async function pipe(stream: CompressionStream | DecompressionStream, data: ArrayBuffer) {
  const writer = stream.writable.getWriter();
  const written = Promise.all([
    writer.write(new Uint8Array(data)),
    writer.close(),
  ]);

  const chunks = [];
  const reader = stream.readable.getReader();

  var result: ReadableStreamReadResult<any>;

  while (!(result = await reader.read()).done) {
    chunks.push(result.value);
  }

  await written;
  return new Blob(chunks).arrayBuffer();
}

export default {
  encode(data: ArrayBuffer) {
    return pipe(new CompressionStream('gzip'), data);
  },
  decode(data: ArrayBuffer) {
    return pipe(new DecompressionStream('gzip'), data);
  }
};
