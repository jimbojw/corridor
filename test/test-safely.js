/**
 * test-safely.js - tests the safely() function.
 */
exports['corridor.safely()'] = function(test) {
  
  var
    
    corridor = require('../src/corridor.js'),
    
    suite = [{
      obj: { a: 'hi' },
      other: { a: 'there' },
      expected: false,
      reason: 'objects with conflicting keys should be not able to merge safely'
    },{
      obj: { a: 'hi' },
      other: { b: 'there' },
      expected: true,
      reason: 'objects with non-conflicting keys should be able to merge safely'
    },{
      obj: { a: 'hi' },
      other: { b: 'there', a: 'sneak attack!' },
      expected: false,
      reason: 'objects with some conflicting keys should not be able to merge safely'
    },{
      obj: ['foo'],
      other: ['bar'],
      expected: true,
      reason: 'arrays should always be able to merge safely'
    },{
      obj: ['foo'],
      other: { "name": "bob" },
      expected: true,
      reason: 'merging an object into an array is weird, but safe'
    },{
      obj: { "name": "bob" },
      other: ['foo'],
      expected: true,
      reason: 'merging an array into an object is weird, but safe'
    },{
      obj: { "employees": [ {"name": "Bob"} ] },
      other: { "employees": [ {"name": "Alice"} ] },
      expected: true,
      reason: 'rich objects with only array keys should safely merge'
    },{
      obj: { "person": {"name": "Bob"} },
      other: { "person": {"name": "Alice"} },
      expected: false,
      reason: 'rich objects with sub-objects that conflict should not merge safely'
    }];
  
  test.expect(suite.length + 1);
  
  test.equals(toString.call(corridor.safely), '[object Function]', 'safely() should be a corridor method');
  
  for (var i = 0, ii = suite.length; i < ii; i++) {
    (function(data){
      var actual = corridor.safely(data.obj, data.other);
      test.equals(actual, data.expected, data.reason);
    })(suite[i]);
  }
  
  test.done();
  
};


