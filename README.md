# M1: Serialization / Deserialization

> Full name: Alex Lin
> Email: alex_lin@brown.edu
> Username: alin90

## Summary

> Summarize your implementation, including key challenges you encountered

My implementation comprises 1 software component, totaling ~450 lines of code. Key challenges included

1. Building on top of node.js native JSON.stringify and JSON.parse to create a custom serialization encoding.
2. Serializing objects and arrays, especially ones with circular nature. A solution was to serialize them together with once function that handles both objects and arrays, and a reference scheme (starting with #REF:$ as the root object or array and adding ".key" for object keys to index into and "[1]" for array indices to index into) was used for circular references, following a stack overflow [here](https://stackoverflow.com/questions/10392293/stringify-convert-to-json-a-javascript-object-with-circular-reference).
3. Serializing and deserializing native objects meant using dfs/bfs to traverse the globalThis object and all its keys while making sure to skip dynamically generated methods like Array.prototype.byteLength.

## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation

_Correcness_: I wrote 5 tests; these tests take ~0.8s to execute. This includes primarily objects with native functions, methods, and circular arrays and objects (which the provided tests did not include)

_Performance_: Evaluating serialization and deserialization on objects of varying sizes using [high-resolution timers](https://nodejs.org/api/perf_hooks.html) results in the following table:

|                | Serialization | Deserialization |
| -------------- | ------------- | --------------- |
| 100 elems      | 8.22ms        | 0.258ms         |
| 1000 elems     | 1.01ms        | 35.7ms          |
| 10000 elems    | 16.5ms        | 31.6ms          |
| 100 funcs      | 0.210ms       | 0.401ms         |
| 1000 funcs     | 1.43ms        | 6.19ms          |
| 10000 funcs    | 21.9ms        | 40.6ms          |
| 1000 cyles     | 0.551ms       | 5.88ms          |
| native objects | 0.789ms       | 2.63ms          |
| native funcs   | 0.667ms       | 1.97ms          |

## Time to Complete

> Roughly, how many hours did this milestone take you to complete?

Hours: 15

## Wild Guess

> This assignment made a few simplifying assumptions — for example, it does not attempt to support the entire language. How many lines of code do you think it would take to support other features? (If at all possible, try to justify your answer — even a rough justification about the order of magnitude and its correlation to missing features is enough.)

FLoC: 1500
