function setUp_() {}
function tearDown_() {}

function runUnitTests() {
  const suite = Test.newTestSuite("All Tests")
    .addSetUp(setUp_)
    .addTearDown(tearDown_)
    .addSuite(getCodeSuite_())
    .addSuite(getRuleSuite_())
    .addSuite(getTranslatorSuite_());
  suite.run();
}

/* ----------------------------------------------------------------------------------------- */

function getCodeSuite_() {
  const suite = Test.newTestSuite("Code")
    .addTest(testIsFrozen_)
    .addTest(testIsObject_)
    .addTest(testDeepMerge_);
  return suite;
}

function testIsFrozen_() {
  let obj = {"key":"value"};
  obj.key = "value2";
  const object = Object.freeze(obj);
  object.key = "value3";
  //Test.willFail(()=>{});
}

function testIsObject_() {
  Test.isFalse(isObject_(""));
  Test.isFalse(isObject_("a"));
  Test.isFalse(isObject_([]));
  Test.isFalse(isObject_(1));
  Test.isFalse(isObject_(0));
  Test.isFalse(isObject_(true));
  Test.isFalse(isObject_(1.3));
  Test.isTrue(isObject_({}));
}

function testDeepMerge_() {
  const source = freeze_({
    "key1": "value1",
    "level1": {
      "key2": "value2",
      "level2": {
        "key3": "value3"
      }
    }
  });
  const target = freeze_({
    "key1a": "value1a",
    "level1": {
      "key2a": "value2a",
      "level2a": {
        "key4": "value4"
      }
    }
  });

  const result = deepMerge_(source, target);
  Test.isEqual(result.key1, "value1");
  Test.isEqual(result.key1a, "value1a");
  Test.isEqual(result.level1.key2, "value2");
  Test.isEqual(result.level1.key2a, "value2a");
  Test.isEqual(result.level1.level2.key3, "value3");
  Test.isEqual(result.level1.level2a.key4, "value4");
}

/* ----------------------------------------------------------------------------------------- */

function getRuleSuite_() {
  const suite = Test.newTestSuite("Rule")
    .addTest(testRule_)
    .addTest(testNestedRule_)
    .addTest(testNestedRule2_)
    .addTest(testArrayRule_)
    .addTest(testReverseRule_);
  return suite;
}

function testRule_() {
  const obj1 = freeze_({'level-one' : 1});
  const rule = newRule("level-one", "one");
  const obj2 = rule.execute(obj1)
  Test.isEqual(obj2.one, 1);

  const rule2 = newRule("level-two", "two");
  const obj3 = rule2.execute(obj1)
  Test.isEqual(obj3.two, "");
}

function testNestedRule_() {
  const obj1 = freeze_({
    'level-one' : {
      'level-two' : 2
    }
  });
  const rule = newRule("level-one.level-two", "two");
  const obj2 = rule.execute(obj1)
  Test.isEqual(obj2.two, 2);

  const rule2 = newRule("level-1.level-2.level-3", "one.two.three");
  const obj3 = rule2.execute(obj1)
  Test.isEqual(obj3.one.two.three, "");
}

function testReverseRule_() {
  const obj2 = freeze_({
    'two' : 2
  });
  const rule = newRule("levelOne.levelTwo", "two");
  const obj1 = rule.execute(obj2, true)
  Test.isEqual(obj1.levelOne.levelTwo, 2);

  const rule2 = newRule("levelOne.levelTwo.levelThree", "one.two.three");
  const obj3 = rule2.execute(obj2, true)
  Test.isEqual(obj3.levelOne.levelTwo.levelThree, "");
}

function testNestedRule2_() {
  const obj1 = freeze_({
    'level-one' : {
      'level-two' : 2
    }
  });
  const rule = newRule("level-one.level-two", "one.two");
  const obj2 = rule.execute(obj1)
  Test.isEqual(obj2.one.two, 2);
}

function testArrayRule_() {
  const source = freeze_({
    'ints' : [
      {'value' : 0 },
      {'value' : 1 },
      {'value' : 2 },
      {'value' : 3 },
      {'value' : 4 },
      {'value' : 5 }
    ]
  });
  const itemRule = newRule("value", "pos");
  const rule = newRule("ints", "nums", ArrayProcessor(itemRule));
  const target = rule.execute(source);
  const reversed = rule.execute(target, true);
  target.nums.forEach((element, index) => Test.isEqual(element.pos, index));
  reversed.ints.forEach((element, index) => Test.isEqual(element.value, index));
}

/* ----------------------------------------------------------------------------------------- */

function getProcessorSuite_() {
  const suite = Test.newTestSuite("Rule")
    .addTest(testDefaultProcessor_)
    .addTest(testJsonStringProcessor_)
    .addTest(testStringNumberProcessor_)
    .addTest(testNumberDateProcessor_)
    .addTest(testFlipDirectionProcessor_)
    .addTest(testArrayStringProcessor_)
    .addTest(testDateFormatProcessor_);
  return suite;
}

function testDefaultProcessor_() {
  const processor = DefaultProcessor("default");
  Test.isEqual(processor.execute(""), "");
  Test.isEqual(processor.execute("a"), "a");
  Test.isEqual(processor.execute([]), []);
  Test.isEqual(processor.execute(1), 1);
  Test.isEqual(processor.execute(true), true);
  Test.isEqual(processor.execute(1.3), 1.3);
  Test.isEqual(processor.execute({}), {});
  Test.isEqual(processor.execute(0), 0);
  Test.isEqual(processor.execute(undefined), "default");
  Test.isEqual(processor.execute(null), "default");
}

function testJsonStringProcessor_() {
  const rule = newRule("field.value");
  const processor = JsonStringProcessor(rule);
  const value = "{\"field\":{\"value\":\"1974-07-18\"}}";
  const test = processor.execute(value, false);
  const reversed = processor.execute(test, true);
  Test.isEqual(test, "1974-07-18");
  Test.isEqual(reversed, value);
  Test.isEqual(JSON.parse(reversed).field.value, "1974-07-18");
}

function testStringNumberProcessor_() {
  const defaultValue = 5;
  const multiplier = 10
  const processor = StringNumberProcessor(multiplier, defaultValue);
  const value = "100";
  const test = processor.execute(value, false);
  const reversed = processor.execute(test, true);
  Test.isEqual(test, 10);
  Test.isEqual(reversed, value);
  Test.isEqual(processor.execute("not a number"), defaultValue);
}

function testDateFormatProcessor_() {
  const processor = DateProcessor();
  const value = "2023-07-13T00:00:00.000+1000";
  const test = processor.execute(value, false);
  const reversed = processor.execute(test, true);
  Test.isEqual(test, "2023-07-13");
  Test.isEqual(reversed, value);
}

function testNumberDateProcessor_() {
  const processor = NumberDateProcessor();
  const value = 1689688800000;
  const test = processor.execute(value, false);
  const reversed = processor.execute(test, true);
  Test.isEqual(test, "2023-07-19");
  Test.isEqual(reversed, value);
}

function testFlipDirectionProcessor_() {
  const processor = FlipDirectionProcessor(NumberDateProcessor());
  const value = "2023-07-19";
  const test = processor.execute(value, false);
  const reversed = processor.execute(test, true);
  Test.isEqual(test, 1689688800000);
  Test.isEqual(reversed, value);
}

function testArrayStringProcessor_() {
  const source = freeze_([
    {'greeting' : "Hello!" },
    {'greeting' : "You're welcome" },
    {'greeting' : "Not me, I think, you." },
    {'greeting' : "Goodbye!" }
  ]);
  const itemRule = newRule("greeting");
  const processor = ArrayStringProcessor(itemRule);
  const target = processor.execute(source)
  const reversed = processor.execute(target, true);
  Test.isEqual(target, "Hello!, You're welcome, Not me\\, I think\\, you., Goodbye!");
  reversed.forEach((element, index) => Test.isEqual(element.greeting, source[index].greeting));
}

/* ----------------------------------------------------------------------------------------- */

function getTranslatorSuite_() {
  const suite = Test.newTestSuite("Translator")
    .addTest(testIsInstance_)
    .addTest(testTranslatorType_)
    .addTest(testIsSource_)
    .addTest(testIsTarget_)
    .addTest(testTranslate_);
  return suite;
}

function testIsInstance_() {
  const translator = newTranslator([]);
  const notATranslator = {};
  Test.isTrue(isInstance(translator));
  Test.isFalse(isInstance(notATranslator));
}

function testTranslatorType_() {
  Test.isEqual(Translator.TYPE.DEFAULT, "DEFAULT");
  Test.isEqual(Translator.TYPE.DATE(), "DATE:Australia/Sydney:yyyy-MM-dd");
  Test.isEqual(Translator.TYPE.DATE("format"), "DATE:Australia/Sydney:format");
  Test.isEqual(Translator.TYPE.DATE("format", "timezone"), "DATE:timezone:format");
  Test.isEqual(Translator.TYPE.ARRAY, "ARRAY");
}

function testIsSource_() {
  const rules = [newRule("level-one", "one")];
  const translator = newTranslator(rules);
  
  const obj1 = freeze_({'level-one' : 1});
  const obj2 = translator.translate(obj1);

  Test.isTrue(translator.isSource(obj1));
  Test.isFalse(translator.isSource(obj2));
}

function testIsTarget_() {
  const rules = [newRule("level-one", "one")];
  const translator = newTranslator(rules);
  
  const obj1 = freeze_({'level-one' : 1});
  const obj2 = translator.translate(obj1);

  Test.isFalse(translator.isTarget(obj1));
  Test.isTrue(translator.isTarget(obj2));
}

function testTranslate_() {
  rules = [
    newRule("levelOne", "one"),
    newRule("levelTwo.one", "two.one"),
    newRule("levelTwo.two", "two.two")
  ];
  const translator = newTranslator(rules);
  const obj1 = freeze_({
    'levelOne' : 1,
    'levelTwo' : {
      'one' : 1,
      'two' : 2
    }
  });
  const obj2 = translator.translate(obj1);

  Test.isEqual(obj2.one, 1);
  Test.isEqual(obj2.two.one, 1);
  Test.isEqual(obj2.two.two, 2);
}