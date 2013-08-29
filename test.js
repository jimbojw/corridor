/**
 * test.js - a couple of unit tests for intricate functionality.
 */
testMerge = corridor.testMerge = function() {
  ([
    {
      obj: ['a'],
      other: ['b'],
      expected: ['a', 'b']
    },
    {
      obj: [{a: 'hi'}],
      other: [{b: 'there'}],
      expected: [{a: 'hi'}, {b: 'there'}]
    },
    {
      obj: {list: ['hi']},
      other: {list: ['there']},
      expected: {list: ['hi','there']}
    },
    {
      obj: {list: ['hi'], foo: 7},
      other: {foo: 8, list: ['there']},
      expected: {list: ['hi','there'], foo: 8}
    },
    {
      obj: {},
      other: { b: 'hi' },
      expected: { b: 'hi' }
    },
    {
      obj: { a: 'whut' },
      other: { b: 'hi' },
      expected: { a: 'whut', b: 'hi' }
    },
  ]).forEach(function(test) {
    var actual = merge(test.obj, test.other);
    if (JSON.stringify(actual) !== JSON.stringify(test.expected)) {
      console.log(["FAILED", test.expected, actual]);
    }
  });
  console.log("PASS");
};

