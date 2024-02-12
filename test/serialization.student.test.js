const util = require('../distribution').util;
const {performance} = require('perf_hooks');

test('(0 pts) circularArray1', () => {
  const x = [1, 2, 3];
  const y = [x, x];
  y.push(y);
  const serialized = util.serialize(y);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(y);
});

test('(0 pts) circularArray2', () => {
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

test('(0 pts) circularArrayAndObjMix', () => {
  const x = [1, 2, 3];
  const z = {a: x, c: 9};
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

test('(0 pts) nativeObjects1', () => {
  const x = Array.prototype;
  const serialized = util.serialize(x);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(x);
});

test('(0 pts) nativeObjects2', () => {
  const x = [console.log, Array.prototype];
  x.push(x);
  const serialized = util.serialize(x);
  const deserialized = util.deserialize(serialized);
  expect(deserialized[1]).toEqual(Array.prototype);
});

test('(0 pts) performanceElements', () => {
  const x = [];
  const y = [];
  const z = [];
  for (let i = 0; i < 100; i++) {
    x.push(i);
  }
  for (let i = 0; i < 1000; i++) {
    y.push('hello world');
  }
  for (let i = 0; i < 10000; i++) {
    z.push(true);
  }

  let startTimeSer;
  let endTimeSer;
  let startTimeDeser;
  let endTimeDeser;
  let serialized;
  let deserialized;

  startTimeSer = performance.now();
  serialized = util.serialize(x);
  endTimeSer = performance.now();
  startTimeDeser = performance.now();
  deserialized = util.deserialize(serialized);
  endTimeDeser = performance.now();
  expect(deserialized).toEqual(x);
  console.log('100 elements serialized: ', endTimeSer - startTimeSer);
  console.log('100 elements deserialized: ', endTimeDeser - startTimeDeser);

  startTimeSer = performance.now();
  serialized = util.serialize(y);
  endTimeSer = performance.now();
  startTimeDeser = performance.now();
  deserialized = util.deserialize(serialized);
  endTimeDeser = performance.now();
  expect(deserialized).toEqual(y);
  console.log('1000 elements serialized: ', endTimeSer - startTimeSer);
  console.log('1000 elements deserialized: ', endTimeDeser - startTimeDeser);

  startTimeSer = performance.now();
  serialized = util.serialize(z);
  endTimeSer = performance.now();
  startTimeDeser = performance.now();
  deserialized = util.deserialize(serialized);
  endTimeDeser = performance.now();
  expect(deserialized).toEqual(z);
  console.log('10000 elements serialized: ', endTimeSer - startTimeSer);
  console.log('10000 elements deserialized: ', endTimeDeser - startTimeDeser);
});

test('(0 pts) performanceFunctions', () => {
  const x = [];
  const y = [];
  const z = [];
  const fn = (a, b) => a + b;

  for (let i = 0; i < 100; i++) {
    x.push(fn);
  }
  for (let i = 0; i < 1000; i++) {
    y.push(fn);
  }
  for (let i = 0; i < 10000; i++) {
    z.push(fn);
  }

  let startTimeSer;
  let endTimeSer;
  let startTimeDeser;
  let endTimeDeser;
  let serialized;

  startTimeSer = performance.now();
  serialized = util.serialize(x);
  endTimeSer = performance.now();
  startTimeDeser = performance.now();
  _ = util.deserialize(serialized);
  endTimeDeser = performance.now();
  console.log('100 functions serialized: ', endTimeSer - startTimeSer);
  console.log('100 functions deserialized: ', endTimeDeser - startTimeDeser);

  startTimeSer = performance.now();
  serialized = util.serialize(y);
  endTimeSer = performance.now();
  startTimeDeser = performance.now();
  _ = util.deserialize(serialized);
  endTimeDeser = performance.now();
  console.log('1000 functions serialized: ', endTimeSer - startTimeSer);
  console.log('1000 functions deserialized: ', endTimeDeser - startTimeDeser);

  startTimeSer = performance.now();
  serialized = util.serialize(z);
  endTimeSer = performance.now();
  startTimeDeser = performance.now();
  _ = util.deserialize(serialized);
  endTimeDeser = performance.now();
  console.log('10000 functions serialized: ', endTimeSer - startTimeSer);
  console.log('10000 functions deserialized: ', endTimeDeser - startTimeDeser);
});

test('(0 pts) performanceCycles', () => {
  const x = [];

  for (let i = 0; i < 1000; i++) {
    x.push(x);
  }

  let startTimeSer;
  let endTimeSer;
  let startTimeDeser;
  let endTimeDeser;
  let serialized;
  let deserialized;

  startTimeSer = performance.now();
  serialized = util.serialize(x);
  endTimeSer = performance.now();
  startTimeDeser = performance.now();
  deserialized = util.deserialize(serialized);
  endTimeDeser = performance.now();
  expect(deserialized).toEqual(x);
  console.log('1000 cycles serialized: ', endTimeSer - startTimeSer);
  console.log('1000 cycles deserialized: ', endTimeDeser - startTimeDeser);
});

test('(0 pts) performanceNatives', () => {
  const x = [];
  const y = [];
  for (let i = 0; i < 1000; i++) {
    x.push(ArrayBuffer);
    y.push(console.log);
  }

  let startTimeSer;
  let endTimeSer;
  let startTimeDeser;
  let endTimeDeser;
  let serialized;
  let deserialized;

  startTimeSer = performance.now();
  serialized = util.serialize(x);
  endTimeSer = performance.now();
  startTimeDeser = performance.now();
  deserialized = util.deserialize(serialized);
  endTimeDeser = performance.now();
  expect(deserialized).toEqual(x);
  console.log('1000 native objects serialized: ', endTimeSer - startTimeSer);
  console.log(
      '1000 native objects deserialized: ',
      endTimeDeser - startTimeDeser,
  );

  startTimeSer = performance.now();
  serialized = util.serialize(y);
  endTimeSer = performance.now();
  startTimeDeser = performance.now();
  deserialized = util.deserialize(serialized);
  endTimeDeser = performance.now();
  expect(deserialized).toEqual(y);
  console.log('1000 native funcs serialized: ', endTimeSer - startTimeSer);
  console.log(
      '1000 native funcs deserialized: ',
      endTimeDeser - startTimeDeser,
  );
});
