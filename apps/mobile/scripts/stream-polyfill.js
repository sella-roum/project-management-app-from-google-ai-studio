const {
  ReadableStream,
  WritableStream,
  TransformStream,
} = require("web-streams-polyfill/ponyfill/es2018");

if (typeof global.ReadableStream === "undefined") {
  global.ReadableStream = ReadableStream;
}

if (typeof global.WritableStream === "undefined") {
  global.WritableStream = WritableStream;
}

if (typeof global.TransformStream === "undefined") {
  global.TransformStream = TransformStream;
}
