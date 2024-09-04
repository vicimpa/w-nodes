export default {
  async encode(data: ArrayBuffer) {
    const compressionStream = new CompressionStream('gzip');
    const writableStream = compressionStream.writable;
    const writer = writableStream.getWriter();

    writer.write(data);
    writer.close();

    const compressedStream = compressionStream.readable;
    const compressedChunks = [];

    const reader = compressedStream.getReader();

    var result: ReadableStreamReadResult<any>;

    while (!(result = await reader.read()).done) {
      compressedChunks.push(result.value);
    }

    return new Blob(compressedChunks).arrayBuffer();

  },
  async decode(data: ArrayBuffer) {
    const decompressionStream = new DecompressionStream('gzip');
    const writableStream = decompressionStream.writable;
    const writer = writableStream.getWriter();

    writer.write(new Uint8Array(data));
    writer.close();

    const decompressedStream = decompressionStream.readable;
    const decompressedChunks = [];

    const reader = decompressedStream.getReader();

    var result: ReadableStreamReadResult<any>;

    while (!(result = await reader.read()).done) {
      decompressedChunks.push(result.value);
    }

    return new Blob(decompressedChunks).arrayBuffer();
  }
};