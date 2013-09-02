/**
 * test-available.js - basic availability test.
 */
exports['basic availability'] = function(test) {
  
  var corridor = require('../src/corridor.js');
  
  test.expect(2);
  test.ok(corridor, 'corridor exists');
  test.equals(Object.prototype.toString.call(corridor), '[object Function]', 'corridor is a function');
  test.done();
  
};

