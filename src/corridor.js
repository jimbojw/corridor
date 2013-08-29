/**
 * corridor.js
 */
(function(window, document, undefined){
'use strict';

var
  
  slice = Array.prototype.slice,
  toString = Object.prototype.toString,
  
  /**
   * Internal logging function.
   * Will only have side-effects if corridor.log has been set to something.
   * Ex: corridor.log = true; // enables internal corridor debug logging
   * If corridor.log is set to a function, it will be called
   */
  log = function() {
    if (typeof corridor.log === 'function') {
      return corridor.log.apply(null, arguments)
    } else if (corridor.log) {
      return console.log.apply(console, arguments);
    }
  },
  
  /**
   * Extract data from DOM or insert values back into it.
   * @param {HTMLElement} elem The element to scan for data (defaults to document)
   * @param {mixed} data The data to insert (optional)
   */
  corridor = window['corridor'] = function(elem, data) {
    elem = elem || document;
    return data ? insert(elem, data) : extract(elem);
  },
  
  /**
   * Extract data from DOM values under the specified element.
   * @param {HTMLElement} root The root element to scan for data.
   */
  extract = corridor.extract = function(root) {
    
    root = root || document;
    
    var data = {};
      
    slice.call(root.querySelectorAll('[data-field]'))
      .filter(hasVal)
      .filter(enabled)
      .forEach(function(elem) { 
      
        var
          opts = options(elem, defaults),
          value = JSON.stringify(coerce(val(elem), opts.type));
        
        upwalk(elem, root, function(elem, field, opts) {
          if (field !== undefined) {
            value = field.replace('$$$', value);
          }
        });
        
        merge(data, JSON.parse(value));
        
      });
    
    return data;
    
  },
  
  /**
   * Insert data into the DOM under the specified element from provided data.
   * @param {HTMLElement} root The element to scan for insertion fields.
   * @param {mixed} data The data to insert.
   */
  insert = corridor.insert = function(root, data) {
    
    slice.call(root.querySelectorAll('[data-field]'))
      .filter(hasVal)
      .forEach(function(elem) { 
      
        var
          opts = options(elem, defaults),
          target = JSON.stringify("\ufff0"),
          queue,
          path,
          value,
          node;
        
        // build up nested representation and parse it out
        upwalk(elem, root, function(elem, field, opts) {
          if (field !== undefined) {
            target = field.replace('$$$', target);
          }
        });
        target = JSON.parse(target);
        
        // find path to target value
        queue = [[target, []]];
        while (!path && queue.length) {
          path = (function(node, stubPath){
            var k, nextPath;
            for (k in node) {
              nextPath = stubPath.concat([k]);
              if (node[k] === "\ufff0") {
                return nextPath;
              } else {
                queue.push([node[k], nextPath]);
              }
            }
          }).apply(null, queue.shift());
        }
        
        // walk down data object, following path to final node
        node = data;
        while (node && path.length) {
          node = node[path.shift()];
        }
        
        // last chance for value coercion, then set the val
        value = node;
        if (value === undefined) {
          return;
        } else if (opts.type === 'json') {
          value = JSON.stringify(value);
        }
        val(elem, value);
        
      });
        
  },
  
  /**
   * Default values applied to data-opts.
   */
  defaults = corridor.defaults = {
    
    /**
     * If the field has a falsey value, this option determines whether it still contributes to the output.
     * Recognized choices are:
     *  - omit - do not add the field at all (default)
     *  - include - include the value in the output
     */
    empty: "omit",
    
    /**
     * The role that this element plays in corridor operations.
     * Recognized choices are:
     *  - field - this element is a field whose value will contribute to extracted data (default)
     *  - toggleable - this element contains fields and may be toggled on or off
     *  - toggle - this element is a checkbox which toggles its nearest parent toggleable
     */
    role: "field",
    
    /**
     * The kind of field this is.
     * Recognized choices are:
     *  - string - treate the value as a string (default)
     *  - boolean - coerce this value to something true/false
     *  - number - parse this value as a number
     *  - json - leave this value as-is (will choke if it's not actually valid JSON)
     *  - list - parse this value as a list of values
     */
    type: "string"
    
  },
  
  /**
   * Visit each corridor ancestor element up from the specified starting node.
   * An element is a corridor element if it has a data-field or data-opts attribute.
   *
   * The provided starting element is visited first.
   * If this isn't desired, send elem.parentNode to upwalk instead.
   *
   * @param {HTMLElement} elem The element to start from.
   * @param {HTMLElement} root Element to stop on / topmost element (may be null).
   * @param {function} callback Function to invoke with each parent.
   * Callback will be passed three parameters:
   *  - elem - The ancestor element,
   *  - field - The string value of the data-field attribute (or undefined)
   *  - opts - Object of options (always an object, may have no keys)
   * If the callback returns boolean false, no further ancestors will be visited.
   *
   * @return {boolean} False if the callback ever returned false, otherwise true.
   */
  upwalk = corridor.upwalk = function(elem, root, callback) {
    var field, opts, res;
    while (elem !== null && elem.getAttribute) {
      if (elem.hasAttribute('data-field') || elem.hasAttribute('data-opts')) {
        field = elem.getAttribute('data-field') || undefined;
        opts = options(elem, defaults);
        res = callback(elem, field, opts);
        if (res === false) {
          return false;
        }
      }
      elem = (elem === root) ? null : elem.parentNode;
    }
    return true;
  },
  
  /**
   * Figure out whether an element is eligible for inclusion by traversing the DOM.
   * @param {HTMLElement} elem The element to start from.
   * @param {HTMLElement} root Element to stop on / topmost element (optional).
   * @return {boolean} True if there are no toggled toggleable ancestors before or including the root.
   */
  enabled = corridor.enabled = function(elem, root) {
    return upwalk(elem.parentNode, root || null, function(parent, field, opts) {
      if (opts.role === 'toggleable' && !toggled(parent)) {
        return false; // short-circuit upwalk();
      }
    });
  },
  
  /**
   * Coerce a string value into the type specified.
   * @param {string} value The string value to coerce.
   * @param {string} type The type to coerce the value into.
   * @return {mixed} A coerced value.
   */
  coerce = corridor.coerce = function(value, type) {
    return (
      type === 'boolean' ? !!value :
      type === 'number' ? parseFloat(value) :
      type === 'list' ? parseList(value) :
      type === 'json' ? JSON.parse(value) :
      value + ''
    );
  },
  
  /**
   * Parse a given string as a list of items.
   * By default, parseList() makes a best guess for the separator between items.
   * But you can explicitly specify a separator in the options.
   *
   * @param {string} text The text to parse.
   * @param {object} opts Additional parsing options (optional).
   *  - separator - string or regex used for splitting the text
   *  - trim - true or false, determines whether values are whitespace chomped
   */
  parseList = corridor.parseList = function(text, opts) {
    if (!text) {
      return [];
    }
    opts = opts || {};
    var sep =
      opts.separator ? opts.separator :      // prefer specified separator
      text.indexOf("\n") !== -1 ? /\r?\n/ :  // use line breaks if there are any
      text.indexOf(",") !== -1 ? ',' :       // or use commas if there are any
      /\s+/;                                 // last resort - any whitespace
    if (!('trim' in opts) || opts.trim) {
      return text.split(sep).map(function(part) {
        return part.replace(/^\s+|\s+$/g, '');
      });
    }
    return text.split(sep);
  },
  
  /**
   * Given a toggleable element, find out if it's toggled off.
   * A toggleable element is an element with "role" set to "toggleable" in its data-opts.
   * It's is toggled value is taken from its nearest child with "role" set to "toggle" is checked.
   *
   * @param {HTMLElement} elem The element to check.
   * @return {mixed} The value of the nearest descendent with "role" set to "toggle".
   */
  toggled = corridor.toggled = function(elem) {
    
    var
      
      // find all the candidate "toggle" elements.
      // to be a candidate, the descendent's nearest parent "toggleable" must be elem.
      candidates = slice.call(elem.querySelectorAll('[data-opts]'))
        .filter(function(child){
          if (options(child).role !== 'toggle') {
            return false;
          }
          var found = false;
          upwalk(child.parentNode, elem, function(parent, field, opts) {
            if (opts.role === 'toggleable') {
              found = (parent === elem);
              return false; // short-circuit upwalk()
            }
          });
          return found;
        });
    
    if (!candidates.length) {
      throw Error('No child "toggle" element found for toggelable.');
    }
    
    if (candidates.length > 1) {
      throw Error('Multiple "toggle" elements have been found for toggleable.');
    }
    
    return val(candidates[0]);
    
  },
  
  /**
   * Get the options for a given element know to have a data-opts attribute.
   * @param {HTMLElement} elem The element to inspect.
   * @param {mixed} defs Optional defaults object to start from.
   */
  options = corridor.options = function(elem, defs) {
    return extend({}, defs || {}, JSON.parse(elem.getAttribute('data-opts') || '{}'));
  },
  
  /**
   * Get or set the value of the specified DOM element.
   * @param {HTMLElement} elem The element whose value is to be determined or set.
   * @param {mixed} value The value to set (optional).
   */
  val = corridor.val = function(elem, value) {
    if (value === undefined) {
      return getVal(elem);
    }
    return setVal(elem, value);
  },
  
  /**
   * Get the value of the specified DOM element.
   * @param {HTMLElement} elem The element whose value is to be determined.
   */
  getVal = val.getVal = function(elem) {
    
    var
      tag = elem.tagName.toLowerCase(),
      type = (tag === 'input') ? elem.getAttribute('type') || 'text' : tag,
      miss = {},
      val = (
        type === 'checkbox' ? elem.checked :
        type === 'text' ? elem.value :
        type === 'textarea' ? elem.value :
        miss
      );
    
    if (val === miss) {
      throw Error("There is no known way to extract a value from the specified element.");
    }
    
    return val;
  },
  
  /**
   * Set the value of the specified DOM element to the provided value.
   * @param {HTMLElement} elem The element whose value is to be set.
   * @param {mixed} value The value to set (optional).
   */
  setVal = val.setVal = function(elem, value) {
    elem.value = value;
  },
  
  /**
   * Determine whether a specified element could have or receive a val.
   * @param {HTMLElement} elem The element to test.
   */
  hasVal = val.hasVal = function(elem) {
    return (/^(input|textarea|select)$/i).test(elem.tagName.toLowerCase());
  },
  
  /**
   * Copy properties from one or more objects onto a target.
   */
  extend = corridor.extend = function(obj /* arg1, arg2, ... argN */) {
    var i, ii, arg, k;
    for (i = 1, ii = arguments.length; i < ii; i++) {
      arg = arguments[i];
      for (k in arg) {
        if (arg.hasOwnProperty(k)) {
          obj[k] = arg[k];
        }
      }
    }
    return obj;
  },
  
  /**
   * Deep merge two plain object heirarchies.
   * Does not check for hasOwnProperty.
   * Does not deal with cyclical references (at all).
   * Concatenates arrays (rather than trying to merge their elements).
   * Doesn't guarantee that new cyclical relationships won't be created.
   * Doesn't guarantee good behavior when asymentrical types are encountered.
   */
  merge = corridor.merge = function(obj, other) {
    
    var key;
    
    if (toString.call(other) === '[object Array]') {
      if (toString.call(obj) === '[object Array]') {
        other.forEach(function(item){
          obj.push(item);
        });
      } else {
        other.forEach(function(item, index) {
          if (index in obj && typeof obj[index] === 'object' && obj[index] !== null) {
            merge(obj[index], item);
          } else {
            obj[index] = item;
          }
        });
      }
    } else {
      for (key in other) {
        if (key in obj && typeof obj[key] === 'object' && obj[key] !== null) {
          merge(obj[key], other[key]);
        } else {
          obj[key] = other[key];
        }
      }
    }
    
    return obj;
  },
  
  /**
   * TODO: move this to a test suite.
   */
  testMerge = corridor.testMerge = function() {
    ([
      {
        obj: ['a'],
        other: ['b'],
        expected: ['a', 'b']
      },
      {
        obj: [{a: 'hi'}],
        other: [{b: 'there'}],
        expected: [{a: 'hi'}, {b: 'there'}]
      },
      {
        obj: {list: ['hi']},
        other: {list: ['there']},
        expected: {list: ['hi','there']}
      },
      {
        obj: {list: ['hi'], foo: 7},
        other: {foo: 8, list: ['there']},
        expected: {list: ['hi','there'], foo: 8}
      },
      {
        obj: {},
        other: { b: 'hi' },
        expected: { b: 'hi' }
      },
      {
        obj: { a: 'whut' },
        other: { b: 'hi' },
        expected: { a: 'whut', b: 'hi' }
      },
    ]).forEach(function(test) {
      var actual = merge(test.obj, test.other);
      if (JSON.stringify(actual) !== JSON.stringify(test.expected)) {
        console.log(["FAILED", test.expected, actual]);
      }
    });
    console.log("PASS");
  };

})(window, document);
