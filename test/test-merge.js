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
    },{
      obj: { "person": { "name": "Bob" } },
      other: { "person": { "email": "bob@company.com" } },
      expected: { "person": { "name": "Bob", "email": "bob@company.com" } },
      reason: 'nested objects should safely merge'
    },{
      obj: { "person": { "name": "Bob" } },
      other: { "person": { "name": "Alice" } },
      expected: { "person": { "name": "Alice" } },
      reason: 'nested conflicting objects should have their keys take precidence'
    },{
      obj: { "person": { "name": "original" } },
      other: { "person": { "name": new String("other") } },
      expected: { "person": { "name": "other" } },
      reason: 'wrapped primitives should be coerced to native primitives'
    }];
  
  test.expect(suite.length);
  
  for (var i = 0, ii = suite.length; i < ii; i++) {
    (function(data){
      var actual = corridor.merge(data.obj, data.other);
      test.equals(JSON.stringify(actual), JSON.stringify(data.expected), data.reason);
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
      test.equals(JSON.stringify(actual), JSON.stringify(data.expected), data.reason);
    })(suite[i]);
  }
  
  test.done();
  
};

exports['corridor.merge(mismatch)'] = function(test) {
  
  var
    
    corridor = require('../src/corridor.js'),
    
    suite = [{
      obj: ['a'],
      other: {0:'b'},
      expected: ['a', 'b'],
      reason: 'arraylike objects should behave like arrays for merging'
    },{
      obj: {"foo":"bar"},
      other: ["baz"],
      expected: {"foo":"bar",0:"baz"},
      reason: 'an array should contribute numeric keys to an object'
    },{
      obj: ['baz'],
      other: {"foo":"bar"},
      expected: {0:"baz","foo":"bar"},
      reason: 'merging a non-array-like object into an array should objectify the array'
    },{
      obj: {"deep":['baz']},
      other: {"deep":{"foo":"bar"}},
      expected: {"deep":{0:"baz","foo":"bar"}},
      reason: 'merging a non-array-like sub-key into an array should objectify the array'
    },{
      obj: {"foo":[]},
      other: {"foo":"bar"},
      expected: {"foo":"bar"},
      reason: 'a primitive value should replace an array when mismatched in an object'
    },{
      obj: {"foo":[]},
      other: {"foo":new String("bar")},
      expected: {"foo":"bar"},
      reason: 'a wrapped primitive value should replace an array when mismatched in an object'
    },{
      obj: {"foo":{"baz":5}},
      other: {"foo":"bar"},
      expected: {"foo":"bar"},
      reason: 'a primitive value should replace an object when mismatched in an object'
    },{
      obj: {"foo":"bar"},
      other: {"foo":[]},
      expected: {"foo":[]},
      reason: 'an array value should replace a primitive when mismatched in an object'
    },{
      obj: {"foo":"bar"},
      other: {"foo":{"baz":5}},
      expected: {"foo":{"baz":5}},
      reason: 'an object should replace a primitive value when mismatched in an object'
    }];
  
  test.expect(suite.length);
  
  for (var i = 0, ii = suite.length; i < ii; i++) {
    (function(data){
      var actual = corridor.merge(data.obj, data.other);
      test.equals(JSON.stringify(actual), JSON.stringify(data.expected), data.reason);
    })(suite[i]);
  }
  
  test.done();
  
};

exports['corridor.merge(concat)'] = function(test) {
  
  var
    
    corridor = require('../src/corridor.js'),
    
    suite = [{
      obj: [{a: 'hi'}],
      other: [{b: 'there'}],
      expected: [{a: 'hi'}, {b: 'there'}],
      reason: 'arrays of non-conflicting objects should concatenate in concat mode'
    }];
  
  test.expect(suite.length);
  
  for (var i = 0, ii = suite.length; i < ii; i++) {
    (function(data){
      var actual = corridor.merge(data.obj, data.other, {merge:'concat'});
      test.equals(JSON.stringify(actual), JSON.stringify(data.expected), data.reason);
    })(suite[i]);
  }
  
  test.done();
  
};

exports['corridor.merge(extend)'] = function(test) {
  
  var
    
    corridor = require('../src/corridor.js'),
    
    suite = [{
      obj: [{a: 'hi'}],
      other: [{b: 'there'}],
      expected: [{a: 'hi', b: 'there'}],
      reason: 'arrays of non-conflicting objects should concatenate in extend mode'
    },{
      obj: [{a: 'hi'}, {b: 'sneak attack!'}],
      other: [{b: 'there'}],
      expected: [{a: 'hi', b: 'there'}, {b: 'sneak attack!'}],
      reason: 'arrays of objects should merge in extend mode'
    }];
  
  test.expect(suite.length);
  
  for (var i = 0, ii = suite.length; i < ii; i++) {
    (function(data){
      var actual = corridor.merge(data.obj, data.other, {merge:'extend'});
      test.equals(JSON.stringify(actual), JSON.stringify(data.expected), data.reason);
    })(suite[i]);
  }
  
  test.done();
  
};

