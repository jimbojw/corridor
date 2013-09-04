/**
 * test-arraylike.js - tests the arraylike() function.
 */
exports['corridor.arraylike()'] = function(test) {
  
  var
    
    corridor = require('../src/corridor.js'),
    tos = function(obj) {
      return Object.prototype.toString.call(obj);
    },
    
    suite = [{
      obj: 'hi',
      expected: false,
      reason: 'a primitive value is not array-like'
    },{
      obj: ['hi'],
      expected: true,
      reason: 'an array is array-like'
    },{
      obj: {"foo":"bar"},
      expected: false,
      reason: 'an object with non-integer keys other than length is not array-like'
    },{
      obj: {},
      expected: true,
      reason: 'an empty object is array-like'
    },{
      obj: {"1":"foo"},
      expected: false,
      reason: 'an object with one element must contain a 0\'th element'
    },{
      obj: {"0":"bar"},
      expected: true,
      reason: 'an object with a 0\'th element is array-like'
    },{
      obj: {"1":"foo","0":"bar"},
      expected: true,
      reason: 'an object with a 0\'th element is array-like, even with out-of-order keys'
    },{
      obj: {"length":0},
      expected: true,
      reason: 'an otherwise empty object with a length property set to 0 is array-like'
    },{
      obj: {"length":2},
      expected: false,
      reason: 'an otherwise empty object with a non-zero length property is not array-like'
    },{
      obj: {"1":"foo","length":2,"0":"bar"},
      expected: true,
      reason: 'an object with a correctly specified length is array-like'
    }];
  
  test.expect(suite.length + 1);
  
  test.equals(tos(corridor.arraylike), '[object Function]', 'arraylike() should be a corridor method');
  
  for (var i = 0, ii = suite.length; i < ii; i++) {
    (function(data){
      var actual = corridor.arraylike(data.obj);
      test.equals(actual, data.expected, data.reason);
    })(suite[i]);
  }
  
  test.done();
  
};


