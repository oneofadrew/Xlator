
class Translator {
  constructor(rules = []) {
    //const validRules = rules.filter((rule) => rule instanceof Rule);
    //if (validRules.length != rules.length) throw new Error("Rules must be of type Rule. Use Translator.getRule(...)");
    this.rules = freeze_(rules);
  }

  translateAll(objects) {
    return objects.map((obj) => this.translate(obj));
  }

  translate(obj) {
    const translations = this.rules.map((rule) => rule.execute(obj, this.isTarget(obj)));
    return translations.reduce((toObj, translation) => deepMerge_(toObj, translation), {});
  }

  isSource(obj) {
    return this.check_(obj, false);
  }

  isTarget(obj) {
    return this.check_(obj, true);
  }

  check_(obj, isTarget) {
    const path = isTarget ? "targetPath" : "sourcePath";
    const targetProperties = this.rules.map((rule) => rule[path]);
    return targetProperties.reduce((exists, property) => exists && obj.hasOwnProperty(property), true);
  }
}

function isInstance(item) {
  return item instanceof Translator;
}

//define the type
Object.defineProperty(Translator, 'TYPE', {
    value: {
    "DEFAULT" : "DEFAULT",
    "DATE" : (format = "yyyy-MM-dd", timezone = "Australia/Sydney") => {return `DATE:${timezone}:${format}`},
    "ARRAY" : "ARRAY"
  },
    writable : false,
    enumerable : true,
    configurable : false
});

function newTranslator(rules) {
  return freeze_(new Translator(rules));
};