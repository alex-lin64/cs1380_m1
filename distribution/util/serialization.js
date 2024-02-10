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
  const parameterRegex = /\((.*?)\)/;
  const parameters = rawFunc.match(parameterRegex)[1].split(/\s*,\s*/);

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

const serializeObj = (obj) => {
  // console.log(JSON.stringify(obj));

  // for nested obj's, should loop through and serialize each element
  const serializedObj = {
    type: "object",
    value: "",
  };

  const updatedObj = {};
  for (const [key, value] of Object.entries(obj)) {
    updatedObj[serialize(key)] = serialize(value);
  }
  // console.log(updatedObj);
  serializedObj.value = JSON.stringify(updatedObj);
  // console.log(serializedObj);
  return JSON.stringify(serializedObj);
};

// deserializes objects
const deserializeObj = (obj) => {
  if (obj.type != "object") {
    console.error("Not an object");
    return;
  }

  const deserializedObj = {};
  const rawObj = JSON.parse(obj.value);

  for (const [key, value] of Object.entries(rawObj)) {
    deserializedObj[deserialize(key)] = deserialize(value);
  }

  return deserializedObj;
};

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
