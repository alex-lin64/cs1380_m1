const util = require("../distribution").util;

test("(0 pts) circularArray1", () => {
  const x = [1, 2, 3];
  const y = [x, x];
  y.push(y);
  const serialized = util.serialize(y);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toBe(y);
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
  expect(deserialized).toBe(y);
});

// [[1, 2, 3, y, [3, x]], [1, 2, 3, y, [3, x]], y];
