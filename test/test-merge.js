/**
 * test-merge.js - tests the merge() function.
 */

var corridor = require('../src/corridor.js');

exports['corridor.merge()'] = function(test) {
  
  var suite = [{
      obj: ['a'],
      other: ['b'],
      expected: ['a', 'b'],
      reason: 'arrays of primitives should concatenate'
    },{
      obj: [{a: 'hi'}],
      other: [{b: 'there'}],
      expected: [{a: 'hi'}, {b: 'there'}],
      reason: 'arrays of objects should concatenate'
    },{
      obj: {list: ['hi']},
      other: {list: ['there']},
      expected: {list: ['hi','there']},
      reason: 'nested arrays of primitives should concatenate'
    },{
      obj: {list: ['hi'], foo: 7},
      other: {foo: 8, list: ['there']},
      expected: {list: ['hi','there'], foo: 8},
      reason: 'primitves should overwrite each other while arrays concatenate'
    },{
      obj: {},
      other: { b: 'hi' },
      expected: { b: 'hi' },
      reason: 'all keys should be added to empty objects'
    },{
      obj: { a: 'whut' },
      other: { b: 'hi' },
      expected: { a: 'whut', b: 'hi' },
      reason: 'missing keys should be added to non-empty objects'
    }
  ];
  
  test.expect(suite.length);
  
  suite.forEach(function(data) {
    var actual = corridor.merge(data.obj, data.other);
    test.deepEqual(actual, data.expected, data.reason);
  });
  
  test.done();
  
};

