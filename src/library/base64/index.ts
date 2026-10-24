const chunk = 0x8000;

export default {
  fromBuffer(buffer: ArrayBuffer) {
    var bytes = new Uint8Array(buffer);
    var parts: string[] = [];

    for (var i = 0; i < bytes.length; i += chunk)
      parts.push(String.fromCharCode(...bytes.subarray(i, i + chunk)));

    return btoa(parts.join(''));
  },
  toBuffer(base64: string) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);

    for (var i = 0; i < binaryString.length; i++)
      bytes[i] = binaryString.charCodeAt(i);

    return bytes.buffer;
  }
};
