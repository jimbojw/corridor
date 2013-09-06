/**
 * test-clone.js - tests the clone() function.
 */
exports['corridor.clone()'] = function(test) {
  
  var
    
    corridor = require('../src/corridor.js'),
    
    tos = function(obj) {
      return Object.prototype.toString.call(obj);
    },
    
    suite = [{
      original: {},
      description: 'empty object'
    },{
      original: [],
      description: 'empty array'
    }];
  
  test.expect(2 * suite.length + 1);
  
  test.equals(tos(corridor.clone), '[object Function]', 'clone() should be a corridor method');
  
  for (var i = 0, ii = suite.length; i < ii; i++) {
    (function(data){
      
      var
        expected = data.original,
        actual = corridor.clone(expected);
        
      test.notStrictEqual(actual, expected, data.description + ' - clone output must not be strictly equal to original');
      test.deepEqual(actual, expected, data.description + ' - clone output must be deepEqual to original');
      
    })(suite[i]);
  }
  
  test.done();
  
};

