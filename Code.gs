/** 
 * Whether the library is immutable (true) or not (false). Defaults to mutable.
 */
let frozen_ = false;

/**
 * When this function is called the Xlator library work with and return immutable objects.
 */
function immutable() { frozen_ = true; }

/**
 * Makes the Xlator library work with mutable objects. This is the default.
 */
function mutable() { frozen_ = false; }

/**
 * Returns whether the Xlator library is producing mutable or immutable objects.
 * @return {boolean} The value of the mutability of the library functions.
 */
function isMutable() { return !frozen_; }

/**
 * If the library is operating in immutable mode this function will freeze the object provided. If not, the
 * function will have no effect.
 * @param {object} o - the object to freeze.
 * @return {object} The frozen object when the library is in immutable mode.
 */
function freeze_(o) { return frozen_ ? Object.freeze(o) : o; }

/**
 * Merges two objects together the entire depth of the object key/value graph.
 * @param {object} source - the source object.
 * @param {object} target - the target object
 * @return {object} the result of the merge of source and target.
 */
function deepMerge_(source, target) {
  if (isObject_(target) && isObject_(source)) {
    const pieces = Object.keys(source).map((key) => 
      isObject_(source[key]) && (key in target) ? 
        { [key]: deepMerge_(source[key], target[key]) } :
        { [key]: source[key] } );
    return freeze_(pieces.reduce((output, piece) => Object.assign(output, piece), Object.assign({}, target) ));
  }
  return freeze_(Object.assign({}, target));
}

/**
 * Tests to see if an item is an object or not.
 * @param {any} item - the item to test.
 * @return {boolean} true if the provided item is an object.
 */
function isObject_(item) {
  return (
    item !== "" &&
    item !== 0 &&
    item &&
    (typeof item !== 'string') &&
    !(item instanceof String) &&
    typeof item === 'object' &&
    !Array.isArray(item)
  );
}