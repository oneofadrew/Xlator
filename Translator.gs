class Translator {
  constructor(rules = []) {
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
    return targetProperties.reduce((exists, property) => exists && obj && obj.hasOwnProperty(property), true);
  }
}

function isInstance(item) {
  return item instanceof Translator;
}

function newTranslator(rules) {
  return freeze_(new Translator(rules));
};