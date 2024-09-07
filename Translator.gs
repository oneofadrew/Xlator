//---------------------------------------------------------------------------------------
// Copyright ⓒ 2024 Drew Harding
// All rights reserved.
//---------------------------------------------------------------------------------------
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
  translateAll(objects, filter=true) {
    return objects.map((obj) => this.translate(obj, filter));
  }

  /**
   * Translates an object. An Object will automatically translate source to target or target to source,
   * depending on the shape of the object provided.
   * @param {object} obj - the object to translate.
   * @return {object} A translated object.
   */
  translate(obj, filter=true) {
    return this.execute(obj, this.isTarget(obj), filter);
  }

  /**
   * Executes the rules for translation using the Rule interface. This means a Translator can also be used
   * in place of a rule to aggregate rules to apply to objects in arrays at sub elements of the object tree.
   * Note: this method shouldn't be called directly - you should use the functions translate or translateAll
   * instead.
   * @param {object} obj - the object to translate.
   * @param {boolean} reverse - the direction of the translation.
   * @param {boolean} filter - filter out undefined values.
   * @return {object} A translated object.
   */
  execute(obj, reverse, filter=true) {
    const translations = this.rules.map((rule) => rule.execute(obj, reverse, filter));
    const validTranslations = filter ? translations.filter((translation) => translation != null) : translations;
    return validTranslations.reduce((toObj, translation) => deepMerge_(toObj, translation), {});
  }

  /**
   * Checks to see if the provided object is a source.
   * @param {object} obj - the object to check.
   * @return {boolean} true if this is a source object.
   */
  isSource(obj) {
    return !this.isTarget(obj);
  }

  /**
   * Checks to see if the provided object is a target.
   * @param {object} obj - the object to check.
   * @return {boolean} true if this is a target object.
   */
  isTarget(obj) {
    let sourceCount = 0;
    let targetCount = 0;

    this.rules.forEach(rule => {
      sourceCount += rule.getSourceValue(obj) === undefined ? 0 : 1;
      targetCount += rule.getTargetValue(obj) === undefined ? 0 : 1;
    });

    if (targetCount === sourceCount) throw new Error(`Unable to determine direction of translation, source count "${sourceCount}" / target count "${targetCount}"`);
    return targetCount > sourceCount;
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