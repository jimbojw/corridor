/**
 * test-available.js - basic availability test.
 */

var corridor = require('../src/corridor.js');

exports.testAvailable = function(test) {
  
  test.expect(2);
  test.ok(corridor, 'corridor exists');
  test.equals(Object.prototype.toString.call(corridor), '[object Function]', 'corridor is a function');
  test.done();
  
};
