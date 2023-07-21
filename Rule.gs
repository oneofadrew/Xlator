
class Rule {
  constructor(fromPath, toPath, processor) {
    this.sourcePath = fromPath ? freeze_(fromPath.split(".")) : fromPath;
    this.targetPath = toPath ? freeze_(toPath.split(".")) : toPath;
    this.processor = processor ? processor : DefaultProcessor("");
  }

  execute(object, reverse = false ) {
    const fromPath = reverse ? this.targetPath : this.sourcePath;
    const toPath = reverse ? this.sourcePath : this.targetPath;
    const value = fromPath ? fromPath.reduce((value, property) => value ? value[property] : undefined, object) : object;
    const processedValue = this.processor.execute(value, reverse);
    return toPath ? toPath.reduceRight((target, property) => (freeze_({ [property] : target })), processedValue) : processedValue;
  }
}

function newRule(apiPath, modelPath, processor) {
  return freeze_(new Rule(apiPath, modelPath, processor));
}

class Processor {
  constructor(execute) {
    this.execute = execute;
  }
}

function newCustomProcessor(execute) {
  return freeze_(new Processor(execute));
}

function FlipDirectionProcessor(processor) {
  const p = processor ? processor : DefaultProcessor("");
  return freeze_(new Processor((value, reverse) => {
    const flipped = !reverse;
    return processor.execute(value, flipped);
  }));
}

function ArrayProcessor(processor) {
  const p = processor ? processor : DefaultProcessor("");
  return freeze_(new Processor((value, reverse) => {
    return Array.isArray(value) ? value.map(entry => p.execute(entry, reverse)) : p.execute(value, reverse);
  }));
}

function ArrayStringProcessor(processor) {
  const p = processor ? processor : DefaultProcessor("");
  return freeze_(new Processor((object, reverse) => {
    if (!reverse) {
      const processedArray = object.map(element => p.execute(element, reverse));
      const safeArray = processedArray.map(element => element.replace(/,/g, "\\,"));
      return safeArray.join(", ");
    } else {
      const safeArrayString = object.replace(/\\,/g,":comma:");
      const safeArray = safeArrayString.split(",").map(element => element.replace(/:comma:/g,",").trim());
      return safeArray.map(element => p.execute(element, reverse));
    }
  }));
}

function DefaultProcessor(defaultValue) {
  return freeze_(new Processor((value) => {
    return value == undefined || value == null ? defaultValue : value;
  }));
}

function JsonStringProcessor(rule) {
  return freeze_(new Processor((value, reverse) => {
    if (!reverse) {
      const json = JSON.parse(value);
      return rule.execute(json, reverse);
    } else {
      const json = rule.execute(value, reverse);
      return JSON.stringify(json);
    }
  }));
}

function StringNumberProcessor(multiplier = 1, defaultValue = 0) {
  return freeze_(new Processor((value, reverse) => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return defaultValue;
    return reverse ? String(numberValue * multiplier) : numberValue / multiplier;
  }));
}

function DateProcessor(sourceTZ = "Australia/Sydney", sourceFormat = "yyyy-MM-dd'T'HH:mm:ss.sssZ", targetTZ = "Australia/Sydney", targetFormat = "yyyy-MM-dd") {
  return freeze_(new Processor((value, reverse) => {
    const fromTZ = reverse ? targetTZ : sourceTZ;
    const fromformat = reverse ? targetFormat : sourceFormat;
    const toTZ = reverse ? sourceTZ : targetTZ
    const toFormat = reverse ? sourceFormat : targetFormat;
    const dateValue = Utilities.parseDate(value, fromTZ, fromformat);
    return Utilities.formatDate(dateValue, toTZ, toFormat);
  }));
}

function NumberDateProcessor(timezone = "Australia/Sydney", format = "yyyy-MM-dd") {
  return freeze_(new Processor((value, reverse) => {
    const dateValue = reverse ? Utilities.parseDate(value, timezone, format) : new Date(value);
    return reverse ? dateValue.getTime() : Utilities.formatDate(dateValue, timezone, format);
  }));
}