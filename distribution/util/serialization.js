let initObjs = false; // false on startup, true after initialization
var pathToNatives = new Map(); // native-hash -> constructs
var nativesToPath = new Map();
pathToNatives.set('global', global);
pathToNatives.set('globalThis.global', globalThis.global);
pathToNatives.set('globalThis.globalThis', globalThis);
nativesToPath.set(global, 'global');
nativesToPath.set(globalThis.global, 'globalThis.global');
nativesToPath.set(globalThis, 'globalThis.globalThis');

// init a map of native objects and functions
function initNativeObjs() {
  if (initObjs) {
    return;
  }

  function dfs(obj, curPath) {
    if (
      pathToNatives.has(curPath) ||
      (typeof obj != 'object' && typeof obj != 'function') ||
      obj == null
    ) {
      return;
    }
    pathToNatives.set(curPath, obj);
    nativesToPath.set(obj, curPath);

    Object.getOwnPropertyNames(obj).forEach((key) => {
      if (visit.has(key)) {
        return;
      }
      visit.add(key);
      if (
        Object.getOwnPropertyDescriptor(obj, key) &&
        Object.getOwnPropertyDescriptor(obj, key).value === undefined
      ) {
        return;
      }
      dfs(obj[key], `${curPath}.${key}`);
      visit.delete(key);
    });
  }

  const visit = new Set();
  visit.add('globalThis');
  dfs(globalThis, 'globalThis');
  initObjs = true;
}

// runs initNative() on module startup
(() => {
  initNativeObjs();
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
  if (t != 'string' && t != 'number' && t != 'boolean') {
    console.error('Not a basic type');
    return;
  }
  const basic = JSON.parse(basicObj.value);
  return basic;
};

// serializes error objects
const serializeError = (err) => {
  const errObj = {
    type: 'error',
    value: err.message,
  };
  return JSON.stringify(errObj);
};

// deserializes error objects
const deserializeError = (errObj) => {
  if (errObj.type != 'error') {
    console.error('Not an error object');
    return;
  }
  const err = new Error(errObj.value);
  return err;
};

// serializes date objects
const serializeDate = (date) => {
  const dateObj = {
    type: 'date',
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
  if (dateObj.type != 'date') {
    console.error('Not an date object');
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
      dateInfo.milliseconds,
  );
};

// serialize null objects
const serializeNull = () => {
  const nullObj = {
    type: 'null',
    value: null,
  };
  return JSON.stringify(nullObj);
};

// deserialize null objects
const deserializeNull = (nullObj) => {
  if (nullObj.type != 'null') {
    console.error('Not an null object');
    return;
  }

  return null;
};

// serialize undefined values
const serializeUndefined = () => {
  const undefinedObj = {
    type: 'undefined',
    value: '',
  };

  return JSON.stringify(undefinedObj);
};

// deserialize undefined values
const deserializeUndefined = (undefinedObj) => {
  if (undefinedObj.type != 'undefined') {
    console.error('Not an undefined object');
    return;
  }

  return undefined;
};

// serializes a function
const serializeFunc = (func) => {
  const funcObj = {
    type: 'function',
    value: '',
  };
  // if the funciton is native function, get custom encoding
  if (nativesToPath.has(func)) {
    funcObj.value = nativesToPath.get(func);
    return JSON.stringify(funcObj);
  }
  funcObj.value = JSON.stringify(func.toString());
  return JSON.stringify(funcObj);
};

// deserializes a function
const deserializeFunc = (funcObj) => {
  if (funcObj.type != 'function') {
    console.error('Not a function object');
    return;
  }
  // if func is serialized native, return the value
  if (pathToNatives.has(funcObj.value)) {
    return pathToNatives.get(funcObj.value);
  }
  const func = new Function(`return ${JSON.parse(funcObj.value)}`)();
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
      type: object instanceof Array ? 'array' : 'object',
      value: '',
    };

    // check if is native, if yes, return custom encoding
    if (nativesToPath.has(obj)) {
      res.value = nativesToPath.get(obj);
      return JSON.stringify(res);
    }

    let updatedObj;
    // if array, traverse like array
    if (object instanceof Array) {
      updatedObj = object.map((ele, i) => {
        if (nativesToPath.has(ele)) {
          const res = {
            type: typeof ele,
            value: nativesToPath.get(ele),
          };
          return JSON.stringify(res);
        }
        if (
          typeof ele !== 'object' ||
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
        // check if is native, if yes, return custom encoding
        if (
          typeof value != 'object' ||
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
  return dfs(obj, '#REF:$');
};

// deserializes objects and arrays
const deserializePartial = (obj) => {
  if (obj.type != 'object' && obj.type != 'array') {
    console.error('Not an object or array');
    return;
  }

  let deserializedObj;

  if (obj.type == 'object') {
    deserializedObj = {};

    // check if native object
    if (pathToNatives.has(obj.value)) {
      return pathToNatives.get(obj.value);
    }

    for (const [key, value] of Object.entries(obj.value)) {
      const parsedKey = deserialize(key);
      const val = JSON.parse(value);
      if (typeof val == 'string' && val.startsWith('#REF:$')) {
        deserializedObj[parsedKey] = val;
        continue;
      }
      if (val.type == 'object' || val.type == 'array') {
        deserializedObj[parsedKey] = deserializePartial(val);
        continue;
      }
      deserializedObj[parsedKey] = deserialize(value);
    }
  } else {
    deserializedObj = [];

    obj.value.forEach((ele) => {
      const val = JSON.parse(ele);
      if (typeof val == 'string' && val.startsWith('#REF:$')) {
        deserializedObj.push(val);
        return;
      }
      if (val.type == 'object' || val.type == 'array') {
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
    let path = '#REF:$';

    if (field !== undefined) {
      obj = parent[field];
      path =
        objToPath.get(parent) +
        (Array.isArray(parent) ? `[${field}]` : `${field ? '.' + field : ''}`);
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
    case 'string':
      return serializeBasics(obj);
    case 'number':
      return serializeBasics(obj);
    case 'boolean':
      return serializeBasics(obj);
    case 'undefined':
      return serializeUndefined(obj);
    case 'object':
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
    case 'function':
      return serializeFunc(obj);
    default:
      console.error('No cases matched for serialization');
  }
}

// main deserialization function
function deserialize(string) {
  // convert the jsonify'd format to obj
  const draft = JSON.parse(string);
  const t = draft.type;

  switch (t) {
    case 'number':
      return deserializeBasics(draft);
    case 'string':
      return deserializeBasics(draft);
    case 'boolean':
      return deserializeBasics(draft);
    case 'error':
      return deserializeError(draft);
    case 'object':
      return deserializeObjAndArrs(draft);
    case 'array':
      return deserializeObjAndArrs(draft);
    case 'date':
      return deserializeDate(draft);
    case 'null':
      return deserializeNull(draft);
    case 'undefined':
      return deserializeUndefined(draft);
    case 'function':
      return deserializeFunc(draft);
    default:
      console.error('No cases matched for deserialization');
  }
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
