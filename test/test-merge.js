/**
 * test-merge.js - tests the merge() function.
 */
exports['corridor.merge(objects)'] = function(test) {
  
  var
    
    corridor = require('../src/corridor.js'),
    
    suite = [{
      obj: {},
      other: { b: 'hi' },
      expected: { b: 'hi' },
      reason: 'all keys should be added to empty objects'
    },{
      obj: { a: 'whut' },
      other: { b: 'hi' },
      expected: { a: 'whut', b: 'hi' },
      reason: 'missing keys should be added to non-empty objects'
    }];
  
  test.expect(suite.length);
  
  for (var i = 0, ii = suite.length; i < ii; i++) {
    (function(data){
      var actual = corridor.merge(data.obj, data.other);
      test.deepEqual(actual, data.expected, data.reason);
    })(suite[i]);
  }
  
  test.done();
  
};

exports['corridor.merge(arrays)'] = function(test) {
  
  var
    
    corridor = require('../src/corridor.js'),
    
    suite = [{
      obj: ['a'],
      other: ['b'],
      expected: ['a', 'b'],
      reason: 'arrays of primitives should concatenate'
    },{
      obj: [{a: 'hi'}],
      other: [{a: 'there'}],
      expected: [{a: 'hi'}, {a: 'there'}],
      reason: 'arrays of conflicting objects should concatenate'
    },{
      obj: [{a: 'hi'}],
      other: [{b: 'there'}],
      expected: [{a: 'hi', b: 'there'}],
      reason: 'arrays of non-conflicting objects should merge'
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
    }];
  
  test.expect(suite.length);
  
  for (var i = 0, ii = suite.length; i < ii; i++) {
    (function(data){
      var actual = corridor.merge(data.obj, data.other);
      test.deepEqual(actual, data.expected, data.reason);
    })(suite[i]);
  }
  
  test.done();
  
};

