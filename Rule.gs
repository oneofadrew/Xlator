
class Rule {
  constructor(fromPath, toPath, defaultValue = "", processor) {
    this.sourcePath = fromPath ? freeze_(fromPath.split(".")) : fromPath;
    this.targetPath = toPath ? freeze_(toPath.split(".")) : toPath;
    this.processor = processor ? processor : DefaultProcessor(defaultValue);
  }

  execute(object, reverse = false ) {
    const fromPath = reverse ? this.targetPath : this.sourcePath;
    const toPath = reverse ? this.sourcePath : this.targetPath;
    const value = fromPath ? fromPath.reduce((value, property) => value ? value[property] : undefined, object) : object;
    const processedValue = Array.isArray(value) ? value.map(entry => this.processor.execute(entry, reverse)) : this.processor.execute(value, reverse);
    return toPath ? toPath.reduceRight((target, property) => (freeze_({ [property] : target })), processedValue) : processedValue;
  }
}

function newRule(apiPath, modelPath, defaultValue, processor) {
  return freeze_(new Rule(apiPath, modelPath, defaultValue, processor));
}

  /*
    DEFAULT
    case "da residual risk":
      return  getRiskFullString(issue.fields[CF_DA_RESIDUAL_RISK_]);
  */

const DefaultProcessor = (defaultValue) => {
  return {
    execute(value) {
      return value == undefined || value == null ? defaultValue : value;
    }
  }
}

const JsonStringProcessor = (rule) => {
  return {
    execute(value, reverse) {
      if (!reverse) {
        const json = JSON.parse(value);
        return rule.execute(json, reverse);
      } else {
        const json = rule.execute(value, reverse);
        return JSON.stringify(json);
      }
    }
  }
}

const FlipDirectionProcessor = (processor) => {
  return {
    execute(value, reverse) {
      const flipped = !reverse;
      return processor.execute(value, flipped);
    }
  }

}

const StringNumberProcessor = (multiplier = 1, defaultValue = 0) => {
  return {
    execute(value, reverse) {

      const numberValue = Number(value);
      if (Number.isNaN(numberValue)) return defaultValue;
      return reverse ? String(numberValue * multiplier) : numberValue / multiplier;
    }
  }
}


const ArrayStringProcessor = (processor) => {
  return {
    execute(object, reverse) {
      if (!reverse) {
        const processedArray = object.map(element => processor.execute(element, reverse));
        const safeArray = processedArray.map(element => element.replace(/,/g, "\\,"));
        return safeArray.join(", ");
      } else {
        const safeArrayString = object.replace(/\\,/g,":comma:");
        const safeArray = safeArrayString.split(",").map(element => element.replace(/:comma:/g,",").trim());
        return safeArray.map(element => processor.execute(element, reverse));
      }
    }
  }
}

const DateProcessor = (sourceTZ = "Australia/Sydney", sourceFormat = "yyyy-MM-dd'T'HH:mm:ss.sssZ", targetTZ = "Australia/Sydney", targetFormat = "yyyy-MM-dd") => {
  return {
    execute(value, reverse) {
      const fromTZ = reverse ? targetTZ : sourceTZ;
      const fromformat = reverse ? targetFormat : sourceFormat;
      const toTZ = reverse ? sourceTZ : targetTZ
      const toFormat = reverse ? sourceFormat : targetFormat;
      const dateValue = Utilities.parseDate(value, fromTZ, fromformat);
      return Utilities.formatDate(dateValue, toTZ, toFormat);
    }
  }
}

const NumberDateProcessor = (timezone = "Australia/Sydney", format = "yyyy-MM-dd") => {
  return {
    execute(value, reverse) {
      const dateValue = reverse ? Utilities.parseDate(value, timezone, format) : new Date(value);
      return reverse ? dateValue.getTime() : Utilities.formatDate(dateValue, timezone, format);
    }
  }
}

