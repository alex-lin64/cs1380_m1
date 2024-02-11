class Queue {
  constructor(arr) {
    this.items = arr;
  }

  enqueue(element) {
    this.items.push(element);
  }

  dequeue() {
    if (this.isEmpty()) {
      return "Underflow";
    }
    return this.items.shift();
  }

  front() {
    if (this.isEmpty()) {
      return "No elements in Queue";
    }
    return this.items[0];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  length() {
    return this.items.length;
  }
}

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

// serializes arrs and any nested objs in the array
const serializeArr = (arr) => {
  // for arrays, make sure to loop through each val and serialize each element
  const arrObj = {
    type: "array",
    value: "",
  };

  const updatedArr = [];
  arr.forEach((ele) => {
    updatedArr.push(serialize(ele));
  });

  arrObj.value = JSON.stringify(updatedArr);
  // console.log(arrObj);
  return JSON.stringify(arrObj);
};

// deserializes arrays
const deserializeArr = (arrObj) => {
  if (arrObj.type != "array") {
    console.error("Not an array object");
    return;
  }

  const arr = [];
  const rawArr = JSON.parse(arrObj.value);

  rawArr.forEach((ele) => {
    arr.push(deserialize(ele));
  });

  return arr;
};

// recursively set all circular references to a ref id for arrays
function circularArr(arr) {}

// recursively set all circular references to a ref id for objs
function circularObj(obj) {
  // dfs to traverse all nodes in obj
  function dfs(object, curPath) {
    if (visit.has(object)) {
      return visit.get(object);
    }

    visit.set(object, JSON.stringify(curPath));
    const res = {
      type: "object",
      value: "",
    };

    const updatedObj = {};

    for (const [key, value] of Object.entries(object)) {
      if (
        typeof value != "object" ||
        object === null ||
        object instanceof Date ||
        object instanceof Error ||
        object instanceof Array
      ) {
        updatedObj[serialize(key)] = serialize(value);
        continue;
      }
      const newPath = curPath + `.${key.toString()}`;
      updatedObj[serialize(key)] = dfs(value, newPath);
    }
    res.value = updatedObj;
    return JSON.stringify(res);
  }

  const visit = new Map();
  visit.set();

  return dfs(obj, "#REF:$");
}

// seralizes an object
const serializeObj = (obj) => {
  const res = circularObj(obj);
  return res;
};

// resolves all circular and duplicate references in the partially
// deserialized object -- credit to https://stackoverflow.com/questions/10392293/stringify-convert-to-json-a-javascript-object-with-circular-reference
// for algo
function resolveRefs(inputObj) {
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

// deserializes objects
const deserializeObj = (obj) => {
  if (obj.type != "object") {
    console.error("Not an object");
    return;
  }

  const deserializedObj = {};

  for (const [key, value] of Object.entries(obj.value)) {
    const parsedKey = deserialize(key);
    const val = JSON.parse(value);
    if (typeof val == "string" && val.startsWith("#REF:$")) {
      deserializedObj[parsedKey] = val;
      continue;
    }
    deserializedObj[parsedKey] = deserialize(value);
  }

  const resObj = resolveRefs(deserializedObj);
  console.log(deserializedObj);

  return resObj;
};

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
        return serializeArr(obj);
      }
      if (obj instanceof Error) {
        return serializeError(obj);
      }
      if (obj instanceof Date) {
        return serializeDate(obj);
      }
      return serializeObj(obj);
    case "function":
      return serializeFunc(obj);
    default:
      console.error("No cases matched for serialization");
  }
}

// main deserialization function
function deserialize(string) {
  // console.log(string);

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
      return deserializeObj(draft);
    case "array":
      return deserializeArr(draft);
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
