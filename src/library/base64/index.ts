export default {
  fromBuffer(buffer: ArrayBuffer) {
    var binaryString = '';
    var bytes = new Uint8Array(buffer);

    bytes.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });

    return btoa(binaryString);
  },
  toBuffer(base64: string) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);

    bytes.forEach((_, i) => {
      bytes[i] = binaryString.charCodeAt(i);
    });

    return bytes.buffer;
  }
};