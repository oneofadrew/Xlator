/**
 * A rule is the entry point for a tranlation of a field from source to target. A rule also implements the
 * Processor interface, so Rules can also be chained together.or linked with other processors. This creates 
 * the ability to navigate to arbitrary levels of an object graph and execute further rules on sub-paths
 * from that point.
 */
class Rule {
  /**
   * Constructor for a Rule.
   * @param {string} fromPath - The dot notation path through the source object to get to the value for this rule, e.g "key1.key2"
   * @param {string} toPath - The dot notation path to put the processed value in the target object, e.g "key1.key2"
   * @param {Processor} processor - A processor for the rule. This is what will process the value that is found at the end of the fromPath for this rule.
   * @return {Rule} The Rule instance that can be used in Object translation.
   */
  constructor(fromPath, toPath, processor) {
    this.sourcePath = fromPath ? freeze_(fromPath.split(".")) : fromPath;
    this.targetPath = toPath ? freeze_(toPath.split(".")) : toPath;
    this.processor = processor ? processor : DefaultProcessor();
  }

  /**
   * Executes a rule on an object.
   * @param {Object} object - The object for the rule to transrom
   */
  execute(object, reverse = false ) {
    const fromPath = reverse ? this.targetPath : this.sourcePath;
    const toPath = reverse ? this.sourcePath : this.targetPath;
    const value = fromPath ? fromPath.reduce((value, property) => value ? value[property] : undefined, object) : object;
    const processedValue = this.processor.execute(value, reverse);
    return toPath ? toPath.reduceRight((target, property) => (freeze_({ [property] : target })), processedValue) : processedValue;
  }
}

/**
 * A rule is the entry point for a tranlation of a field from source to target. A rule also implements the Processor interface (see
 * Xlator.CustomProcessor(function)), so Rules can also be chained together.or linked with other processors. This creates the
 * ability to navigate to arbitrary levels of an object graph and execute further rules on sub-paths from that point.
 * @param {string} fromPath - The dot notation path through the source object to get to the value for this rule, e.g "key1.key2"
 * @param {string} toPath - The dot notation path to put the processed value in the target object, e.g "key1.key2"
 * @param {Processor} processor - A processor or another rule to apply to this rule. This is what will process the value that is found at the end of the fromPath for this rule.
 * @return {Rule} The Rule instance that can be used in Object translation.
 */
function newRule(fromPath, toPath, processor) {
  return freeze_(new Rule(fromPath, toPath, processor));
}

class Processor {
  constructor(execute) {
    this.execute = execute;
  }
}

/**
 * A processor has a single function with parameters (value, reverse) where object is the value to process and reverse is a boolean
 * that signifies whether we are processing the rule from source to target (false) or target to source (true). A processor will
 * receive a point in the object graph as defined by the Rule that encapsulates it. All rules provided by the Xlator library are
 * bidirectional.
 * @param {function} execute - the fuction to execute for this processor.
 * @return {Processor} The corresponding Processor instance.
 */
function CustomProcessor(execute) {
  return freeze_(new Processor(execute));
}

/**
 * The FlipDirectionProcessor changes the direction of the processor provided. For instance a StringNumberProcessor becomes a NumberStringProcessor.
 * @param {function} processor - The processor to flip direction on.
 * @return {Processor} The corresponding Processor instance.
 */
function FlipDirectionProcessor(processor) {
  const p = processor ? processor : DefaultProcessor();
  return freeze_(new Processor((value, reverse) => {
    const flipped = !reverse;
    return processor.execute(value, flipped);
  }));
}

/**
 * The ArrayProcessor picks up the value and if it's an array iterates over it and calls the child processor to create an array of processed values.
 * @param {function} processor - The processor to process an item in the array.
 * @return {Processor} The corresponding Processor instance.
 */
function ArrayProcessor(processor) {
  const p = processor ? processor : DefaultProcessor();
  return freeze_(new Processor((value, reverse) => {
    return Array.isArray(value) ? value.map(entry => p.execute(entry, reverse)) : p.execute(value, reverse);
  }));
}

/**
 * The ArrayString Processor receives an array and iterates over with the child processor to create an array of processed values and then creates
 * a comma separated string with the values that are returned. If a value contains a comma, it is escapted with a backslash, e.g. "\,".
 * @param {function} processor - The processor to process an item in the array.
 * @return {Processor} The corresponding Processor instance.
 */
function ArrayStringProcessor(processor) {
  const p = processor ? processor : DefaultProcessor();
  return freeze_(new Processor((object, reverse) => {
    if (!reverse) {
      if (!object) return "";
      const processedArray = object.map(element => p.execute(element, reverse));
      const safeArray = processedArray.map(element => element ? element.replace(/,/g, "\\,") : element);
      return safeArray.join(", ");
    } else {
      if (!object) return null;
      const safeArrayString = object.replace(/\\,/g,":comma:");
      const safeArray = safeArrayString.split(",").map(element => element ? element.replace(/:comma:/g,",").trim() : element);
      return safeArray.map(element => p.execute(element, reverse));
    }
  }));
}

/**
 * A DefaultProcessor simply returns the value provided, or defaults to a provided default value if the value is null or
 * undefined. If no default value is provided then an empty string is returned.
 * @param (any) defaultValue - the default value to return when undefined.
 * @return {Processor} The corresponding Processor instance.
 */
function DefaultProcessor(defaultValue = "") {
  return freeze_(new Processor((value) => {
    return value == undefined || value == null ? defaultValue : value;
  }));
}

/**
 * A JsonStringProcessor expects to receive a string from the source that contains JSON, and will parse it
 * and then pass it on to the chained processor for further work. In this case it may be beneficial to use an
 * instance of a Rule as the processor in order to navigate futher into the object graph of the parsed JSON.
 * @param {Processor} rule - the rule or processor to use to process the parsed JSON value.
 * @return {Processor} The corresponding Processor instance.
 */
function JsonStringProcessor(rule) {
  return freeze_(new Processor((value, reverse) => {
    if (!reverse) {
      const json = JSON.parse(value);
      return rule.execute(json, reverse);
    } else {
      const json = rule.execute(value, reverse);
      return json ? JSON.stringify(json) : json;
    }
  }));
}

/**
 * Converts the value from a string to a number. The StringNumberProcessor can also supports some small
 * tweaks to the number as well as a chained Processor.
 * @param {number} multiplier - a number to multiply the parsed number by. Defaults to 1.
 * @param {number} defaultValue - the default value to use if a number is not found. Defaults to 0.
 * @param {Processor} processor - a processor to chain to this one. Defaults to DefaultProcessor(defaultValue).
 * @return {Processor} The corresponding Processor instance.
 */
function StringNumberProcessor(multiplier = 1, defaultValue = 0, processor) {
  const chainedProcessor = processor ? processor : DefaultProcessor(defaultValue);
  return freeze_(new Processor((value, reverse) => {
    if (value === null || value === undefined) return null;
    if (reverse) {
      const numberValue = chainedProcessor.execute(value, reverse);
      return String(numberValue * multiplier);
    } else {
      const numberValue = Number(value);
      if (Number.isNaN(numberValue)) return defaultValue;
      numberFactor = numberValue / multiplier;
      return chainedProcessor.execute(numberFactor, reverse);
    }
  }));
}

/**
 * A DateProcessor converts a string representation of a date from a source format and timezone to a target
 * format and timezone.
 * @param {string} sourceTZ - the source timezone. Default is "GMT".
 * @param {string} sourceFormat - the source format. Default is "yyyy-MM-dd'T'HH:mm:ss.sssZ".
 * @param {string} targetTZ - the target timezone. Default is "Australia/Sydney".
 * @param {string} targetFormat - the target format. Default is "yyyy-MM-dd".
 * @return {Processor} The corresponding Processor instance.
 */
function DateProcessor(sourceTZ = "Australia/Sydney", sourceFormat = "yyyy-MM-dd'T'HH:mm:ss.sssZ", targetTZ = "Australia/Sydney", targetFormat = "yyyy-MM-dd", defaultValue = "") {
  return freeze_(new Processor((value, reverse) => {
    if (value === undefined || value === null) return defaultValue;
    const fromTZ = reverse ? targetTZ : sourceTZ;
    const fromformat = reverse ? targetFormat : sourceFormat;
    const toTZ = reverse ? sourceTZ : targetTZ
    const toFormat = reverse ? sourceFormat : targetFormat;
    const dateValue = Utilities.parseDate(value, fromTZ, fromformat);
    return Utilities.formatDate(dateValue, toTZ, toFormat);
  }));
}

/**
 * A StringDateProcessor converts a string representation of a date from a source format and timezone to a Date object.
 * @param {string} timezone - the timezone. Default is "Australia/Sydney".
 * @param {string} format - the format. Default is "yyyy-MM-dd".
 * @return {Processor} The corresponding Processor instance.
 */
function StringDateProcessor(timezone = "Australia/Sydney", format = "yyyy-MM-dd'T'HH:mm:ss.sssZ") {
  return freeze_(new Processor((value, reverse) => {
    if (value === undefined || value === null) return reverse ? "" : null;
    return reverse ? Utilities.formatDate(value, timezone, format) : Utilities.parseDate(value, timezone, format);
  }));
}

/**
 * Converts a number to a Date object with a provided format and timezone.
 * @param {string} timezone - the target timezone. Default is "Australia/Sydney".
 * @param {string} format - the target format. Default is "yyyy-MM-dd".
 * @return {Processor} The corresponding Processor instance.
 */
function NumberDateProcessor(timezone = "Australia/Sydney", format = "yyyy-MM-dd") {
  return freeze_(new Processor((value, reverse) => {
    if (value === undefined || value === null) return null;
    const dateValue = reverse ? Utilities.parseDate(value, timezone, format) : new Date(value);
    return reverse ? dateValue.getTime() : Utilities.formatDate(dateValue, timezone, format);
  }));
}