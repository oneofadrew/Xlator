//---------------------------------------------------------------------------------------
// Copyright ⓒ 2024 Drew Harding
// All rights reserved.
//---------------------------------------------------------------------------------------
function setUp_() {}
function tearDown_() {}
const nullProcessor = CustomProcessor(() => null);

function runUnitTests_() {
  const suite = Test.newTestSuite("All Tests")
    .addSetUp(setUp_)
    .addTearDown(tearDown_)
    .addSuite(getCodeSuite_())
    .addSuite(getRuleSuite_())
    .addSuite(getTranslatorSuite_());
  suite.run();
}

//---------------------------------------------------------------------------------------

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

//---------------------------------------------------------------------------------------

function getRuleSuite_() {
  const suite = Test.newTestSuite("Rule")
    .addTest(testRule_)
    .addTest(testNestedRule_)
    .addTest(testNestedRule2_)
    .addTest(testArrayRule_)
    .addTest(testReverseRule_)
    .addTest(testArrayRuleNesting_)
    .addTest(testArrayRuleFlattening_);
  return suite;
}

function testRule_() {
  //null checks
  const nullRule = newRule("level-one", "one", nullProcessor);
  Test.isEqual(nullRule.execute(null, true), {"level-one" : null});
  Test.isEqual(nullRule.execute(undefined, true), {"level-one" : null});
  Test.isEqual(nullRule.execute(null, false), {"one" : null});
  Test.isEqual(nullRule.execute(undefined, false), {"one" : null});

  const obj1 = freeze_({'level-one' : 1});
  const rule = newRule("level-one", "one");

  const obj2 = rule.execute(obj1)
  Test.isEqual(obj2.one, 1);

  const rule2 = newRule("level-two", "two");
  const obj3 = rule2.execute(obj1)
  Test.isEqual(obj3.two, "");
}

function testNestedRule_() {
  //null checks
  const nullRule = newRule("level-one.level-two", "two", nullProcessor);
  Test.isEqual(nullRule.execute(null, true), {"level-one" : {"level-two" : null}});
  Test.isEqual(nullRule.execute(undefined, true), {"level-one" : {"level-two" : null}});
  Test.isEqual(nullRule.execute(null, false), {"two" : null});
  Test.isEqual(nullRule.execute(undefined, false), {"two" : null});

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
  //null checks
  const nullRule = newRule("levelOne.levelTwo", "two", nullProcessor);
  Test.isEqual(nullRule.execute(null, true), {"levelOne" : {"levelTwo" : null}});
  Test.isEqual(nullRule.execute(undefined, true), {"levelOne" : {"levelTwo" : null}});
  Test.isEqual(nullRule.execute(null, false), {"two" : null});
  Test.isEqual(nullRule.execute(undefined, false), {"two" : null});

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
  //null checks
  const nullRule = newRule("level-one.level-two", "one.two", nullProcessor);
  Test.isEqual(nullRule.execute(null, true), {"level-one" : {"level-two" : null}});
  Test.isEqual(nullRule.execute(undefined, true), {"level-one" : {"level-two" : null}});
  Test.isEqual(nullRule.execute(null, false), {"one" : {"two" : null}});
  Test.isEqual(nullRule.execute(undefined, false), {"one" : {"two" : null}});

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
  //null checks
  const nullRule = newRule("ints", "nums", ArrayProcessor(nullProcessor));
  Test.isEqual(nullRule.execute(null, true), {"ints" : null});
  Test.isEqual(nullRule.execute(undefined, true), {"ints" : null});
  Test.isEqual(nullRule.execute(null, false), {"nums" : null});
  Test.isEqual(nullRule.execute(undefined, false), {"nums" : null});
  
  Test.isEqual(nullRule.execute({"nums" : [1,2,3]}, true), {"ints" : [null, null, null]});
  Test.isEqual(nullRule.execute({"ints" : [1,2,3]}, false), {"nums" : [null, null, null]});

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

function testArrayRuleNesting_() {
  //null checks
  const source = freeze_({
    'sides' : [
      {'left' : 0, "right" : 5},
      {'left' : 1, "right" : 6},
      {'left' : 2, "right" : 7},
      {'left' : 3, "right" : 8},
      {'left' : 4, "right" : 9},
      {'left' : 5, "right" : 10}
    ]
  });
  const rules = [ newRule("left", "x") , newRule("right", "y") ];
  const nested = newTranslator(rules);
  const rule = newRule("sides", "pos", ArrayProcessor(nested));
  const target = rule.execute(source);
  const reversed = rule.execute(target, true);
  target.pos.forEach((element, index) => Test.isEqual(element.x, index));
  target.pos.forEach((element, index) => Test.isEqual(element.y, index + 5));
  reversed.sides.forEach((element, index) => Test.isEqual(element.left, index));
  reversed.sides.forEach((element, index) => Test.isEqual(element.right, index + 5));
}

function testArrayRuleFlattening_() {
  //null checks
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
  const itemRule = newRule("value");
  const rule = newRule("ints", "nums", ArrayProcessor(itemRule));
  const target = rule.execute(source);
  const reversed = rule.execute(target, true);
  target.nums.forEach((element, index) => Test.isEqual(element, index));
  reversed.ints.forEach((element, index) => Test.isEqual(element.value, index));
}

//---------------------------------------------------------------------------------------

function getProcessorSuite_() {
  const suite = Test.newTestSuite("Rule")
    .addTest(testDefaultProcessor_)
    .addTest(testJsonStringProcessor_)
    .addTest(testStringNumberProcessor_)
    .addTest(testDateProcessor_)
    .addTest(testNumberDateProcessor_)
    .addTest(testStringDateProcessor_)
    .addTest(testStringToNumberDateProcessor_)
    .addTest(testFlipDirectionProcessor_)
    .addTest(testArrayStringProcessor_)
    .addTest(testDateFormatProcessor_);
  return suite;
}

function testDefaultProcessor_() {
  const processor = DefaultProcessor("default");
  
  Test.isEqual(processor.execute("", false), "");
  Test.isEqual(processor.execute("a", false), "a");
  Test.isEqual(processor.execute([], false), []);
  Test.isEqual(processor.execute(1, false), 1);
  Test.isEqual(processor.execute(true, false), true);
  Test.isEqual(processor.execute(1.3, false), 1.3);
  Test.isEqual(processor.execute({}, false), {});
  Test.isEqual(processor.execute(0, false), 0);
  Test.isEqual(processor.execute(undefined, false), "default");
  Test.isEqual(processor.execute(null, false), "default");

  Test.isEqual(processor.execute("", true), "");
  Test.isEqual(processor.execute("a", true), "a");
  Test.isEqual(processor.execute([], true), []);
  Test.isEqual(processor.execute(1, true), 1);
  Test.isEqual(processor.execute(true, true), true);
  Test.isEqual(processor.execute(1.3, true), 1.3);
  Test.isEqual(processor.execute({}, true), {});
  Test.isEqual(processor.execute(0, true), 0);
  Test.isEqual(processor.execute(undefined, true), "default");
  Test.isEqual(processor.execute(null, true), "default");
}

function testJsonStringProcessor_() {
  //nullChecks
  const nullP = JsonStringProcessor(nullProcessor);
  Test.isEqual(nullP.execute(null, false), null);
  Test.isEqual(nullP.execute(null, true), null);

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
  //nullChecks
  const nullP = StringNumberProcessor(null, null, nullProcessor);
  Test.isEqual(nullP.execute(null, false), null);
  Test.isEqual(nullP.execute(null, true), null);

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

function testDateProcessor_() {
  //nullChecks
  const nullP = DateProcessor();
  Test.isEqual(nullP.execute(null, false), "");
  Test.isEqual(nullP.execute(null, true), "");

  const processor = DateProcessor();
  const value = "2023-07-13T00:00:00.000+1000";
  const test = processor.execute(value, false);
  const reversed = processor.execute(test, true);
  Test.isEqual(test, "2023-07-13");
  Test.isEqual(reversed, value);
}

function testNumberDateProcessor_() {
  //nullChecks
  const nullP = NumberDateProcessor();
  Test.isEqual(nullP.execute(null, false), null);
  Test.isEqual(nullP.execute(null, true), null);

  const processor = NumberDateProcessor();
  const value = 1689688800000;
  const test = processor.execute(value, false);
  const reversed = processor.execute(test, true);
  Test.isEqual(test, "2023-07-19");
  Test.isEqual(reversed, value);
}

function testStringDateProcessor_() {
  //nullChecks
  const nullP = StringDateProcessor();
  Test.isEqual(nullP.execute(null, false), null);
  Test.isEqual(nullP.execute(null, true), "");

  const processor = StringDateProcessor();
  const value = "2023-07-13T00:00:00.000+1000";
  const test = processor.execute(value, false);
  const reversed = processor.execute(test, true);
  Test.isEqual(test, new Date(1689688800000));
  Test.isEqual(reversed, value);
}

function testStringToNumberDateProcessor_() {
  //nullChecks
  const nullP = StringNumberProcessor(null, null, nullProcessor);
  Test.isEqual(nullP.execute(null, false), null);
  Test.isEqual(nullP.execute(null, true), null);

  const processor = StringNumberProcessor(1,0,NumberDateProcessor());
  const value = "1689688800000";
  const test = processor.execute(value, false);
  const reversed = processor.execute(test, true);
  Test.isEqual(test, "2023-07-19");
  Test.isEqual(reversed, value);
}

function testFlipDirectionProcessor_() {
  //nullChecks
  const nullP = FlipDirectionProcessor(nullProcessor);
  Test.isEqual(nullP.execute(null, false), null);
  Test.isEqual(nullP.execute(null, true), null);

  const processor = FlipDirectionProcessor(NumberDateProcessor());
  const value = "2023-07-19";
  const test = processor.execute(value, false);
  const reversed = processor.execute(test, true);
  Test.isEqual(test, 1689688800000);
  Test.isEqual(reversed, value);
}

function testArrayStringProcessor_() {
  //nullChecks
  const nullP = ArrayStringProcessor(nullProcessor);
  Test.isEqual(nullP.execute(null, false), "");
  Test.isEqual(nullP.execute(null, true), null);

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

//---------------------------------------------------------------------------------------

function getTranslatorSuite_() {
  const suite = Test.newTestSuite("Translator")
    .addTest(testIsInstance_)
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