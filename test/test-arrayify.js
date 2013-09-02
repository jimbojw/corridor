/**
 * test-arrayify.js - tests the arrayify() function.
 */
exports['corridor.arrayify()'] = function(test) {
  
  var
    corridor = require('../src/corridor.js'),
    tos = function(obj) {
      return Object.prototype.toString.call(obj);
    },
    arry;
    
  test.expect(3);
  
  test.equals(tos(corridor.arrayify), '[object Function]', 'arrayify is a function');
  
  // create an actual array from an array-like object
  arry = corridor.arrayify({
    length: 3,
    0: "all",
    1: "the",
    2: "roads"
  });
  
  test.equals(tos(arry), '[object Array]', 'arry should be a real array');
  test.equals(arry.length, 3, 'arry.length should match original object\'s length property');
  
  test.done();
  
};

exports['corridor.arrayify.map()'] = function(test) {
  
  var
    corridor = require('../src/corridor.js'),
    tos = function(obj) {
      return Object.prototype.toString.call(obj);
    },
    arry,
    res;
    
  test.expect(3);
  
  test.equals(tos(corridor.arrayify.map), '[object Function]', 'arrayify.map is a function');
  
  arry = corridor.arrayify({
    length: 4,
    0: "we",
    1: "have",
    2: "to",
    3: "walk"
  });
  
  test.equals(tos(arry.map), '[object Function]', 'arry should have a map() method');
  
  res = arry.map(function(item, index) {
    return [index, item.length];
  });
  
  test.deepEqual(
    res,
    [ [0, 2], [1, 4], [2, 2], [3, 4] ],
    'map() output should contain returned values'
  );
  
  test.done();
  
};

exports['corridor.arrayify.filter()'] = function(test) {
  
  var
    corridor = require('../src/corridor.js'),
    tos = function(obj) {
      return Object.prototype.toString.call(obj);
    },
    arry,
    res;
    
  test.expect(3);
  
  test.equals(tos(corridor.arrayify.filter), '[object Function]', 'arrayify.filter is a function');
  
  arry = corridor.arrayify({
    length: 4,
    0: "are winding",
    1: "and all the lights",
    2: "that light the way",
    3: "are blinding"
  });
  
  test.equals(tos(arry.filter), '[object Function]', 'arry should have a filter() method');
  
  res = arry.filter(function(item, index) {
    return (/inding$/).test(item);
  });
  
  test.deepEqual(
    res,
    [ "are winding", "are blinding" ],
    'filter() output should only contain values for which the filter callback returned true'
  );
  
  test.done();
  
};

