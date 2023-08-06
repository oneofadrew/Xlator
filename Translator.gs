/**
 * A Translator contains a list of rules that can translate an object from one shape to another. Each rule maps from a source path
 * defined as a string with dot notation to pull out a value or location within the key/value graph of the object and then applies
 * a processor chain to it in order to convert it to a new value. The new value is then placed in a new object in a new location as
 * defined by the target path of the rule. As long as the rules are bidirectional, a Translator can go both ways - from source to
 * target, or target to source, allowing for rich and powerful transformations of objects between integrations and services.
 */
class Translator {
  /**
   * Constructor for Translator.
   * @param {array[Rule]} rules - the rules to use for the translation.
   */
  constructor(rules = []) {
    this.rules = freeze_(rules);
  }

  /**
   * Translates an array of objects. Each object will automatically translate source to target or target to source,
   * depending on the shape of the object provided.
   * @param {array[object]} objects - the array of objects to translate.
   * @return {array[object]} An array of translated objects.
   */
  translateAll(objects) {
    return objects.map((obj) => this.translate(obj));
  }

  /**
   * Translates an object. An Object will automatically translate source to target or target to source,
   * depending on the shape of the object provided.
   * @param {object} objects - the object to translate.
   * @return {object} A translated object.
   */
  translate(obj) {
    const translations = this.rules.map((rule) => rule.execute(obj, this.isTarget(obj)));
    return translations.reduce((toObj, translation) => deepMerge_(toObj, translation), {});
  }

  /**
   * Checks to see if the provided object is a source.
   * @param {object} obj - the object to check.
   * @return {boolean} true if this is a source object.
   */
  isSource(obj) {
    return this.check_(obj, false);
  }

  /**
   * Checks to see if the provided object is a target.
   * @param {object} obj - the object to check.
   * @return {boolean} true if this is a target object.
   */
  isTarget(obj) {
    return this.check_(obj, true);
  }

  /**
   * Checks to see if a provided object is in the shape of the source or the target by testing for the appropriate paths
   * from the rule set.
   * @param {object} obj - the object to check.
   * @param {boolean} isTarget - true to check for target, false to check for source.
   * @return {boolean} The corresponding boolean value for the requested test.
   */
  check_(obj, isTarget) {
    const path = isTarget ? "targetPath" : "sourcePath";
    const targetProperties = this.rules.map((rule) => rule[path]);
    return targetProperties.reduce((exists, property) => exists && obj && obj.hasOwnProperty(property), true);
  }
}

/**
 * Checks to see if an item is an instance of the Translator class.
 * @param {any} item - the item to check.
 * @return {boolean} true if the item is an instance of a Translator.
 */
function isInstance(item) {
  return item instanceof Translator;
}

/**
 * A Translator contains a list of rules that can translate an object from one shape to another. Each rule maps from a source path
 * defined as a string with dot notation to pull out a value or location within the key/value graph of the object and then applies
 * a processor chain to it in order to convert it to a new value. The new value is then placed in a new object in a new location as
 * defined by the target path of the rule. As long as the rules are bidirectional, a Translator can go both ways - from source to
 * target, or target to source, allowing for rich and powerful transformations of objects between integrations and services.
 * @param {array[Rule]} rules - the rules to use for the translation.
 * @return {Translator} A translator object that encapsulates the provided rules.
 */
function newTranslator(rules) {
  return freeze_(new Translator(rules));
};