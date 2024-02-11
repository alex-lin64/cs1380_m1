// hardcode builtin libraries to serialize/deserialize
const fs = require("fs");
const http = require("http");
const https = require("https");
const url = require("url");
const path = require("path");
const os = require("os");
const events = require("events");
const stream = require("stream");
const util = require("util");
const querystring = require("querystring");
const zlib = require("zlib");
const buffer = require("buffer");
const childProcess = require("child_process");
const cluster = require("cluster");
const dgram = require("dgram");
const dns = require("dns");
const http2 = require("http2");
const v8 = require("v8");

let init = false; // false on startup, true after natives been initialized
var natives = new Map(); // native-hash -> constructs
// init a map of native objects and functions
function initNative() {
  if (init) {
    return;
  }

  // Helper function to recursively traverse objects and functions
  function traverse(obj, path) {
    if (typeof obj !== "object" && typeof obj !== "function") return;

    // Map object or function to its path
    natives.set(path, obj);

    // Recursively traverse properties if obj is an object
    if (typeof obj === "object") {
      for (const key in obj) {
        traverse(obj[key], `${path}.${key}`);
      }
    }

    // Recursively traverse prototype if obj is a function
    if (typeof obj === "function" && obj.prototype) {
      traverse(obj.prototype, `${path}.prototype`);
    }
  }

  // Start traversal from globalThis
  for (const key in globalThis) {
    traverse(globalThis[key], key);
  }

  // Example usage
  console.log(natives);
  init = true;
}
// runs initNative() on module startup
(() => {
  // initNative();
})();

// serializes the basics (string, number, boolean)
const serializeBasics = (basicType) => {
  const obj = {
    type: typeof basicType,
    value: JSON.stringify(basicType),
  };
  return JSON.stringify(obj);
};

// deserializes the basics (string, number, boolean)
const deserializeBasics = (basicObj) => {
  const t = basicObj.type;
  if (t != "string" && t != "number" && t != "boolean") {
    console.error("Not a basic type");
    return;
  }
  const basic = JSON.parse(basicObj.value);
  return basic;
};

// serializes error objects
const serializeError = (err) => {
  const errObj = {
    type: "error",
    value: err.message,
  };
  return JSON.stringify(errObj);
};

// deserializes error objects
const deserializeError = (errObj) => {
  if (errObj.type != "error") {
    console.error("Not an error object");
    return;
  }
  const err = new Error(errObj.value);
  return err;
};

// serializes date objects
const serializeDate = (date) => {
  const dateObj = {
    type: "date",
    value: {},
  };
  let dateInfo = {};
  // Extracting individual date components
  dateInfo.year = date.getFullYear(); // Full year (e.g., 2024)
  dateInfo.month = date.getMonth(); // Month (0-11)
  dateInfo.day = date.getDate(); // Day of the month (1-31)
  dateInfo.hours = date.getHours(); // Hours (0-23)
  dateInfo.minutes = date.getMinutes(); // Minutes (0-59)
  dateInfo.seconds = date.getSeconds(); // Seconds (0-59)
  dateInfo.milliseconds = date.getMilliseconds(); // Milliseconds (0-999)
  dateObj.value = JSON.stringify(dateInfo);

  return JSON.stringify(dateObj);
};

// deserializes date objects
const deserializeDate = (dateObj) => {
  if (dateObj.type != "date") {
    console.error("Not an date object");
    return;
  }

  const dateInfo = JSON.parse(dateObj.value);

  return new Date(
    dateInfo.year,
    dateInfo.month,
    dateInfo.day,
    dateInfo.hours,
    dateInfo.minutes,
    dateInfo.seconds,
    dateInfo.milliseconds
  );
};

// serialize null objects
const serializeNull = () => {
  const nullObj = {
    type: "null",
    value: null,
  };
  return JSON.stringify(nullObj);
};

// deserialize null objects
const deserializeNull = (nullObj) => {
  if (nullObj.type != "null") {
    console.error("Not an null object");
    return;
  }

  return null;
};

// serialize undefined values
const serializeUndefined = () => {
  const undefinedObj = {
    type: "undefined",
    value: "",
  };

  return JSON.stringify(undefinedObj);
};

// deserialize undefined values
const deserializeUndefined = (undefinedObj) => {
  if (undefinedObj.type != "undefined") {
    console.error("Not an undefined object");
    return;
  }

  return undefined;
};

// serializes a function
const serializeFunc = (func) => {
  const funcObj = {
    type: "function",
    value: serialize(func.toString()),
  };

  return JSON.stringify(funcObj);
};

// deserializes a function
const deserializeFunc = (funcObj) => {
  if (funcObj.type != "function") {
    console.error("Not a function object");
    return;
  }

  const rawFunc = deserialize(funcObj.value);

  const func = new Function(`return ${rawFunc}`)();
  // console.log(func.toString());
  return func;
};

// seralizes objects and arrays
const serializeObjAndArrs = (obj) => {
  // dfs to traverse all nodes in obj
  function dfs(object, curPath) {
    if (visit.has(object)) {
      return visit.get(object);
    }

    visit.set(object, JSON.stringify(curPath));
    const res = {
      type: object instanceof Array ? "array" : "object",
      value: "",
    };

    let updatedObj;
    // if array, traverse like array
    if (object instanceof Array) {
      updatedObj = object.map((ele, i) => {
        if (
          typeof ele !== "object" ||
          ele === null ||
          ele instanceof Date ||
          ele instanceof Error
        ) {
          return serialize(ele);
        }
        const newPath = `${curPath}[${i}]`;
        return dfs(ele, newPath);
      });
    } else {
      // traverse like object
      updatedObj = {};
      // loop every key-value pair
      for (const [key, value] of Object.entries(object)) {
        if (
          typeof value != "object" ||
          value === null ||
          value instanceof Date ||
          value instanceof Error
        ) {
          updatedObj[serialize(key)] = serialize(value);
          continue;
        }
        const newPath = `${curPath}.${key.toString()}`;
        updatedObj[serialize(key)] = dfs(value, newPath);
      }
    }
    res.value = updatedObj;
    return JSON.stringify(res);
  }
  const visit = new Map();
  return dfs(obj, "#REF:$");
};

// deserializes objects and arrays
const deserializePartial = (obj) => {
  if (obj.type != "object" && obj.type != "array") {
    console.error("Not an object or array");
    return;
  }

  let deserializedObj;

  if (obj.type == "object") {
    deserializedObj = {};

    for (const [key, value] of Object.entries(obj.value)) {
      const parsedKey = deserialize(key);
      const val = JSON.parse(value);
      if (typeof val == "string" && val.startsWith("#REF:$")) {
        deserializedObj[parsedKey] = val;
        continue;
      }
      if (val.type == "object" || val.type == "array") {
        deserializedObj[parsedKey] = deserializePartial(val);
        continue;
      }
      deserializedObj[parsedKey] = deserialize(value);
    }
  } else {
    deserializedObj = [];

    obj.value.forEach((ele) => {
      const val = JSON.parse(ele);
      if (typeof val == "string" && val.startsWith("#REF:$")) {
        deserializedObj.push(val);
        return;
      }
      if (val.type == "object" || val.type == "array") {
        deserializedObj.push(deserializePartial(val));
        return;
      }
      const deserEle = deserialize(ele);
      deserializedObj.push(deserEle);
    });
  }
  return deserializedObj;
};

// deserializes the references
const deserializeObjAndArrs = (obj) => {
  const partialDeserialized = deserializePartial(obj);
  return resolveRefsObjs(partialDeserialized);
};

// resolves all circular and duplicate references in the partially
// deserialized object -- credit to https://stackoverflow.com/questions/10392293/stringify-convert-to-json-a-javascript-object-with-circular-reference
// for algo
function resolveRefsObjs(inputObj) {
  let objToPath = new Map();
  let pathToObj = new Map();

  let traverse = (parent, field) => {
    let obj = parent;
    let path = "#REF:$";

    if (field !== undefined) {
      obj = parent[field];
      path =
        objToPath.get(parent) +
        (Array.isArray(parent) ? `[${field}]` : `${field ? "." + field : ""}`);
    }

    objToPath.set(obj, path);
    pathToObj.set(path, obj);

    let ref = pathToObj.get(obj);
    if (ref) parent[field] = ref;

    for (let f in obj) if (obj === Object(obj)) traverse(obj, f);
  };

  traverse(inputObj);
  return inputObj;
}

// main serialization function
function serialize(obj) {
  switch (typeof obj) {
    case "string":
      return serializeBasics(obj);
    case "number":
      return serializeBasics(obj);
    case "boolean":
      return serializeBasics(obj);
    case "undefined":
      return serializeUndefined(obj);
    case "object":
      if (obj === null) {
        return serializeNull(obj);
      }
      if (obj instanceof Array) {
        return serializeObjAndArrs(obj);
      }
      if (obj instanceof Error) {
        return serializeError(obj);
      }
      if (obj instanceof Date) {
        return serializeDate(obj);
      }
      return serializeObjAndArrs(obj);
    case "function":
      return serializeFunc(obj);
    default:
      console.error("No cases matched for serialization");
  }
}

// main deserialization function
function deserialize(string) {
  // convert the jsonify'd format to obj
  const draft = JSON.parse(string);
  const t = draft.type;

  switch (t) {
    case "number":
      return deserializeBasics(draft);
    case "string":
      return deserializeBasics(draft);
    case "boolean":
      return deserializeBasics(draft);
    case "error":
      return deserializeError(draft);
    case "object":
      return deserializeObjAndArrs(draft);
    case "array":
      return deserializeObjAndArrs(draft);
    case "date":
      return deserializeDate(draft);
    case "null":
      return deserializeNull(draft);
    case "undefined":
      return deserializeUndefined(draft);
    case "function":
      return deserializeFunc(draft);
    default:
      console.error("No cases matched for deserialization");
  }
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
