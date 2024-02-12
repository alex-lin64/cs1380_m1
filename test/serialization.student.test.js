const util = require("../distribution").util;

test("(0 pts) circularArray1", () => {
  const x = [1, 2, 3];
  const y = [x, x];
  y.push(y);
  const serialized = util.serialize(y);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(y);
});

test("(0 pts) circularArray2", () => {
  const x = [1, 2, 3];
  const z = [3, x];
  const y = [x, x];
  y.push(y);
  x.push(y);
  x.push(z);
  const serialized = util.serialize(y);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(y);
});

test("(0 pts) circularArrayAndObjMix", () => {
  const x = [1, 2, 3];
  const z = { a: x, c: 9 };
  const y = [x, x];
  y.push(y);
  x.push(y);
  x.push(z);
  z.b = y;
  z.self = z;
  const serialized = util.serialize(y);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(y);
});

test("(0 pts) nativeObjects1", () => {
  const x = Array.prototype;
  const serialized = util.serialize(x);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(x);
});

test("(0 pts) nativeObjects2", () => {
  const x = [console.log, Array.prototype];
  x.push(x);
  const serialized = util.serialize(x);
  const deserialized = util.deserialize(serialized);
  expect(deserialized[1]).toEqual(Array.prototype);
});
