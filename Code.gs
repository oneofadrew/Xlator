let frozen_ = true;
function immutable() { frozen_ = frozen_ || true; }
function isImmutable() { return frozen_; }
function mutable() { frozen_ = frozen_ && false; }
function isMutable() { return !frozen_; }
function freeze_(o) { return frozen_ ? Object.freeze(o) : o; }

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

/*

To Do
gardens
clean

Tue
flights
pool

Wed

Thu
Nate's Dietician

Fri
Lunch witb Ivan

*/