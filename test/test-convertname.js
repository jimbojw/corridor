/**
 * test-convertname.js - tests the convertName() function.
 */
exports['corridor.convertName()'] = function(test) {
  
  var
    
    corridor = require('../src/corridor.js'),
    
    suite = [{
      name: 'name',
      field: '{"name":$$$}',
      reason: 'basic name should become property field'
    },{
      name: 'foo.bar',
      field: '{"foo":{"bar":$$$}}',
      reason: 'dot nested name parts should become a nested object field'
    },{
      name: 'foo bar',
      field: '{"foo bar":$$$}',
      reason: 'whitespace inside field names should be preserved'
    },{
      name: 'a.b.c.d.e',
      field: '{"a":{"b":{"c":{"d":{"e":$$$}}}}}',
      reason: 'dot nested name parts can nest to any level'
    },{
      name: 'a b.c d.e f',
      field: '{"a b":{"c d":{"e f":$$$}}}',
      reason: 'spaces in dot nested name parts should be preserved'
    },{
      name: '[]',
      field: '[$$$]',
      reason: 'empty square brackets alone should contribute to an array'
    },{
      name: '[ ]',
      field: '[$$$]',
      reason: 'whitespace in square brackets alone should be treated as empty'
    },{
      name: '[name]',
      field: '{"name":$$$}',
      reason: 'brackets around a solitary key should become a property field'
    },{
      name: '[].name',
      field: '[{"name":$$$}]',
      reason: 'empty square brackets alone should contribute to an array'
    },{
      name: 'person[]name',
      field: '{"person":[{"name":$$$}]}',
      reason: 'unprefixed key after square brackets should still be a key'
    },{
      name: '[][]',
      field: '[[$$$]]',
      reason: 'nested square brackets should create an array in an array'
    },{
      name: 'list[]',
      field: '{"list":[$$$]}',
      reason: 'empty square brackets after a key adds to that key\'s array'
    },{
      name: 'foo[bar]',
      field: '{"foo":{"bar":$$$}}',
      reason: 'non-empty square brackets act just like a dot delimited key'
    },{
      name: ' foo [ bar ] ',
      field: '{"foo":{"bar":$$$}}',
      reason: 'whitespace virtually anywhere should not not change the output'
    },{
      name: 'foo[bar].baz[]',
      field: '{"foo":{"bar":{"baz":[$$$]}}}',
      reason: 'mixing bracket and dot key styles is fine'
    },{
      name: '{"authors":$$$}',
      field: '{"authors":$$$}',
      reason: 'presence of $$$ anywhere should indicate field format'
    },{
      name: '[$$$]',
      field: '[$$$]',
      reason: 'presence of $$$ anywhere should indicate field format'
    }];
  
  test.expect(suite.length);
  
  for (var i = 0, ii = suite.length; i < ii; i++) {
    (function(data){
      var actual = corridor.convertName(data.name);
      test.deepEqual(actual, data.field, data.reason);
    })(suite[i]);
  }
  
  test.done();
  
};

