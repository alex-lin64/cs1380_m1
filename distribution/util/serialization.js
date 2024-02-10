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

// serializes arrs and any nested objs in the array
const serializeArray = (arr) => {
  // for arrays, make sure to loop through each val and serialize each element
  const arrObj = {
    type: "array",
    value: "",
  };
};

const serializeObj = (obj) => {
  // console.log(JSON.stringify(obj));

  // for nested obj's, should loop through and serialize each element
  return JSON.stringify(obj);
};

function serialize(obj) {
  switch (typeof obj) {
    case "string":
      return serializeBasics(obj);
    case "number":
      return serializeBasics(obj);
    case "boolean":
      return serializeBasics(obj);
    case "symbol":
    case "undefined":
    case "object":
      if (obj instanceof Array) {
        return serializeArray(obj);
      }
      if (obj instanceof Error) {
        return serializeError(obj);
      }
      return serializeObj(obj);
    case "function":
  }
  return "No cases caught";
}

function deserialize(string) {
  // console.log(string);

  // convert the jsonify'd format to obj
  const draft = JSON.parse(string);
  const t = draft.type;

  if (t == "number" || t == "string" || t == "boolean") {
    return deserializeBasics(draft);
  }
  if (t == "error") {
    return deserializeError(draft);
  }
  // console.log(draft);
  return draft;
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
