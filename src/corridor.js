/**
 * corridor.js
 * 
 * corridor is written to run in either a Node.js context or a browser context.
 * The context and property objects are used to know how to export corridor.
 *
 * @param {mixed} context The context object (either module or window)
 * @param {string} property The name of the key to assign on the context object (either 'exports' or 'corridor')
 */
(function(context, property, undefined){
'use strict';

var
  
  slice = Array.prototype.slice,
  toString = Object.prototype.toString,
  
  document = context.document || null,
  
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
   * Extract data from the DOM or insert values back into it.
   * @param {HTMLElement} root The element to scan for data (defaults to document)
   * @param {mixed} data The data to insert (optional)
   * @param {object} opts Hash of options (optional)
   * Relevant options are:
   *  - enabledOnly - Whether to only include enabled elements
   */
  corridor = context[property] = function(root, data, opts) {
    root = root || document;
    return data ? insert(root, data, opts) : extract(root, opts);
  },
  
  /**
   * Convert an array-like object into a real, usable array (for IE8).
   * @param {mixed} obj An array-like object.
   * @return {array} A real array.
   */
  arrayify = corridor.arrayify = function(obj) {
    if (toString.call(obj) !== '[object Array]') {
      try {
        obj = slice.call(obj);
      } catch (err) {
        obj = (function(ret, i) {
          while (i--) {
            ret[i] = obj[i];
          }
          return ret;
        })([], obj.length);
      }
    }
    // add shim methods
    for (var k in arrayify) {
      if (!(k in obj)) {
        obj[k] = arrayify[k];
      }
    }
    return obj;
  },
  
  /**
   * Actual map, or shim implementation if necessary (for IE8).
   * @param {function} callback Function to invoke for each element of this array.
   * @param {mixed} self Object to use for this when executing callback.
   * @return {array} Collected results of running the callback on each element.
   */
  map = corridor.arrayify.map = Array.prototype.map || function(callback, self) {
    var i, ii, ret = [];
    for (i = 0, ii = this.length; i < ii; i++) {
      if (i in this) {
        ret[i] = callback.call(self, this[i], i, this);
      }
    }
    return arrayify(ret);
  },
  
  /**
   * Actual forEach, or shim implementation if necessary (for IE8).
   * @param {function} callback Function to invoke for each element of this array.
   * @param {mixed} self Object to use for this when executing callback.
   */
  forEach = corridor.arrayify.forEach = Array.prototype.forEach || map,
  
  /**
   * Actual filter, or shim implementation if necessary (for IE8).
   * @param {function} callback Function to invoke for each element of this array.
   * @param {mixed} self Object to use for this when executing callback.
   * @return {array} Subset of elements from original array where callback returned a truthy value.
   */
  filter = corridor.arrayify.filter = Array.prototype.filter || function(callback, self) {
    var i, ii, ret = [], item;
    for (i = 0, ii = this.length; i < ii; i++) {
      if (i in this) {
        item = this[i];
        if (callback.call(self, item, i, this)) {
          ret.push(item);
        }
      }
    }
    return arrayify(ret);
  },
  
  /**
   * Extract data from DOM values under the specified element.
   * @param {HTMLElement} root The root element to scan for data.
   * @param {object} opts Hash of options (optional, see corridor options)
   */
  extract = corridor.extract = function(root, opts) {
    
    root = root || document;
    
    // fail fast if there's no root element to use
    if (!root) {
      throw Error('corridor requires a queryable root element to insert extract data from');
    }
    
    var
      settings = extend({}, defaults, opts),
      data = {},
      fields = selectFields(root, settings).filter(hasVal);
    
    if (settings.enabledOnly) {
      fields = fields.filter(enabled);
    }
      
    fields.forEach(function(elem) {
      
      var
        opts = options(elem, settings),
        value = val(elem),
        contrib,
        field;
      
      // build out full contribution
      contrib = buildup("\ufff0", elem, root);
      field = contrib.split("\ufff0").join('$$$');
      
      // short-circuit if this field should be omitted
      if (!value && !includeEmpty(field, elem, opts)) {
        return;
      }
      
      // create type-specific value string
      value = JSON.stringify(coerce(value, opts.type, opts));
      
      // inject value into contribution
      value = contrib.replace("\ufff0", value);
      
      // merge contribution into the result data
      merge(data, JSON.parse(value));
      
    });
    
    return data;
    
  },
  
  /**
   * Insert data into the DOM under the specified element from provided data.
   * @param {HTMLElement} root The element to scan for insertion fields (optional).
   * @param {mixed} data The data to insert.
   * @param {object} opts Hash of options (optional, see corridor options)
   */
  insert = corridor.insert = function(root, data, opts) {
    
    // allow root to be optional
    root = root || document;
    
    // fail fast if there's no root element to use
    if (!root) {
      throw Error('corridor requires a queryable root element to insert data into');
    }
    
    var
      
      settings = extend({}, defaults, opts),
      
      // data structure for existing fields
      // used to figure out true contribution paths for inserting data into elements
      workspace = {},
      
      fields = selectFields(root, settings).filter(hasVal);
    
    if (settings.enabledOnly) {
      fields = fields.filter(enabled);
    }
    
    // for each value'd, enabled field
    fields
      .map(function(elem) {
        
        var target, path;
        
        // build up the target contribution
        // starting with "\ufff0" value tag
        target = JSON.parse(buildup(JSON.stringify("\ufff0"), elem, root));
        
        // insert into workspace
        merge(workspace, target);
        
        // find path to target in workspace
        path = locate(workspace, "\ufff0");
        
        // set actual val into workspace to prevent false hits for future fields
        (function(pathCopy){
          var
            opts = options(elem, settings),
            node = workspace;
          while (pathCopy.length > 1) {
            node = node[pathCopy.shift()];
          }
          node[pathCopy[0]] = coerce(val(elem), opts.type, opts)
        })(path.slice(0));
        
        // emit path/elem tuple
        return {path:path, elem:elem};
        
      })
      .forEach(function(tuple){
        
        var
          // for each path/elem pair
          path = tuple.path,
          elem = tuple.elem,
          opts = options(elem),
          
          // walk down input data object, following path to final node
          value = follow(path, data);
        
        if (value !== undefined) {
          // last chance for value coercion, then assign val to elem
          val(elem, (
            opts.type === 'json' ? JSON.stringify(value) :
            opts.type === 'list' ? listify(value) :
            value
          ));
        }
        
      });
      
  },
  
  /**
   * Default values applied to options.
   */
  defaults = corridor.defaults = {
    
    /**
     * If the field has a falsey value, this option determines whether it still contributes to the output.
     * Recognized choices are:
     *  - auto - detect the best choice based on the element (default)
     *  - include - include the value in the output
     *  - omit - do not add the field at all
     */
    empty: "auto",
    
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
     *  - auto - detect the best fit from among the other options (default)
     *  - string - treate the value as a string (default)
     *  - boolean - turn this value into something true/false
     *  - number - parse this value as a number
     *  - json - leave this value as-is (will choke if it's not actually valid JSON)
     *  - list - parse this value as a list of values
     */
    type: "auto",
    
    /**
     * When inserting/extracting, only operate on enabled fields (default: true).
     */
    enabledOnly: true,
    
    /**
     * Strategy to employ when merging two objects.
     * Recognized choices are:
     *  - auto - intelligently merge the objects (default)
     *  - concat - always concatenate arrays
     *  - extend - iterate through items and merge them
     */
    merge: 'auto'
    
  },
  
  /**
   * Select an array of field elements from the specified root element.
   * @param {HTMLElement} root The root element to search for fields.
   */
  selectFields = corridor.selectFields = function(root, opts) {
    return arrayify(root.querySelectorAll('[name], [data-name]'));
  },
  
  /**
   * Visit each corridor ancestor element up from the specified starting node.
   * An element is a corridor element if it has a name, data-name or data-opts attribute.
   *
   * The provided starting element is visited first.
   * If this isn't desired, send elem.parentNode to upwalk instead.
   *
   * @param {HTMLElement} elem The element to start from.
   * @param {HTMLElement} root Element to stop on / topmost element (may be null).
   * @param {function} callback Function to invoke with each parent.
   * Callback will be passed three parameters:
   *  - elem - The ancestor element,
   *  - field - The string value of the name/data-name attribute (or undefined)
   *  - opts - Object of options (always an object, may have no keys)
   * If the callback returns boolean false, no further ancestors will be visited.
   *
   * @return {boolean} False if the callback ever returned false, otherwise true.
   */
  upwalk = corridor.upwalk = function(elem, root, callback) {
    
    var field, opts, res;
    
    while (elem !== null && elem.getAttribute) {
      
      field = convertName(
        elem.hasAttribute('data-name') ? elem.getAttribute('data-name') :
        elem.hasAttribute('name') ? elem.getAttribute('name') :
        undefined
      ) || undefined;
      
      if (field || hasOpts(elem)) {
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
   * Check whether a given element has any options directly specified.
   * @param {HTMLElement} elem The element to inspect.
   * @return {boolean} True if this element has any options specified.
   */
  hasOpts = corridor.hasOpts = function(elem) {
    if (elem.hasAttribute('data-opts')) {
      return true;
    }
    for (var k in defaults) {
      if (elem.hasAttribute('data-' + k)) {
        return true;
      }
    }
    return false;
  },
  
  /**
   * Convert a simple name attribute string into a full field string if it isn't already.
   * The simple name format is a hybrid of Apple's Key-Value Coding and PHP's array-based form variables.
   *
   * Examples:
   *  - 'foo' --> '{"foo":$$$}'
   *  - 'foo.bar' --> '{"foo":{"bar":$$$}}'
   *  - '[]' --> '[$$$]'
   *  - 'list[]' --> 'list[$$$]'
   *  - 'foo[bar]' --> '{"foo":{"bar":$$$}}'
   *  - 'foo[bar][]' --> '{"foo":{"bar":[$$$]}}'
   *
   * @see https://developer.apple.com/library/ios/DOCUMENTATION/Cocoa/Conceptual/KeyValueCoding/Articles/BasicPrinciples.html
   * @see http://php.net/manual/en/faq.html.php#faq.html.arrays
   *
   * @param {string} name The name string to convert.
   * @return {string} The full field string.
   */
  convertName = corridor.convertName = function(name) {
    
    // short-circuit if a falsey value was passed in
    if (!name) {
      return null;
    }
    
    // check if this name value is already a field type
    if ((/\$\$\$/).test(name)) {
      return name;
    }
    
    var
      
      field = "\ufff0",                      // start out with the target mark
      
      parts = name
      .replace(/^\s+|\s+$/g, '')             // trim whitespace for courtesy
      .replace(/\[\s+]/g, '[]')              // trim inside bracket vars
      .replace(/\[([^\]]+)]/g, '.$1')        // convert bracket vars to dot vars
      .match(/[^[\].]+|\[\]/g);              // grab list of component parts
    
    arrayify(parts).forEach(function(p) {
      p = p.replace(/^\s+|\s+$/g, '');       // trim each part
      field = field.replace("\ufff0",        // add part to field specification
        p === '[]' ? "[\ufff0]" : "{" + JSON.stringify(p || 'undefined') + ":\ufff0}"
      );
    });
    
    return field.split("\ufff0").join('$$$');
    
  },
  
  /**
   * Decide whether the element's value should contribute to output if empty.
   * @param {string} field The full field format specification for this element.
   * @param {HTMLElement} elem The element to decide for.
   * @param {object} opts Options to use to decide.
   * @return {boolean} Only true if an empty value should be included.
   */
  includeEmpty = corridor.includeEmpty = function(field, elem, opts) {
    return (
      opts.empty === 'include' ? true :
      opts.empty === 'omit' ? false :
      elem.hasAttribute('required') ? true :
      field.indexOf('[$$$]') !== -1 ? false :
      elem.type === 'checkbox' ? false :
      true
    );
    
  },
  
  /**
   * Walk up the parent chain and perform replacements to build up full contribution.
   * @param {string} value Starting value, must be a string.
   * @param {HTMLElement} elem The element to start walking up from.
   * @param {HTMLElement} root The topmost/stop element (optional).
   * @return {string} The built up contribution string.
   */
  buildup = corridor.buildup = function(value, elem, root) {
    upwalk(elem, root || null, function(elem, field, opts) {
      if (field !== undefined) {
        value = field.replace('$$$', value);
      }
    });
    return value;
  },
  
  /**
   * Follow a given path down a data object to find the bottom node.
   * If the path can't be followed all the way down, this function returns undefined.
   * @param {array} path Array of keys to use to walk down node.
   * @param {mixed} node The starting node to traverse down.
   * @return {mixed} The final node at the bottom of the path if discoverable.
   */
  follow = corridor.follow = function(path, node) {
    while (node && path.length) {
      node = node[path.shift()];
    }
    return node;
  },
  
  /**
   * Starting from a given data node, locate the specified value and report its path.
   * @param {mixed} node The starting data node to traverse.
   * @param {mixed} value The value to locate (by strict equality check).
   * @return {array} An array of keys pointing to the value, or undefined if not found.
   */
  locate = corridor.locate = function(node, value) {
    
    var
      queue = [[node, []]],
      path;
    
    while (!path && queue.length) {
      path = (function(node, stubPath){
        var i, ii, k, nextPath;
        if (toString.call(node) === '[object Array]') {
          for (i = 0, ii = node.length; i < ii; i++) {
            nextPath = stubPath.concat([i]);
            if (node[i] === value) {
              return nextPath;
            } else {
              queue.push([node[i], nextPath]);
            }
          }
        } else {
          for (k in node) {
            nextPath = stubPath.concat([k]);
            if (node[k] === value) {
              return nextPath;
            } else {
              queue.push([node[k], nextPath]);
            }
          }
        }
      }).apply(null, queue.shift());
    }
    
    return path;
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
   * @param {mixed} opts Options to pass forward to parsers (optional).
   * @return {mixed} A coerced value.
   */
  coerce = corridor.coerce = function(value, type, opts) {
    if (type === 'auto') {
      try {
        return JSON.parse(value);
      } catch (err) {
        return value + '';
      }
    }
    return (
      type === 'boolean' ? !!value :
      type === 'number' ? parseFloat(value) :
      type === 'list' ? parseList(value, opts) :
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
    text = text.replace(/^\s+|\s+$/g, '');
    var sep =
      opts.separator ? opts.separator :      // prefer specified separator
      text.indexOf("\n") !== -1 ? /\r?\n/ :  // use line breaks if there are any
      text.indexOf(",") !== -1 ? ',' :       // or use commas if there are any
      /\s+/;                                 // last resort - any whitespace
    if (!('trim' in opts) || opts.trim) {
      return arrayify(text.split(sep)).map(function(part) {
        return part.replace(/^\s+|\s+$/g, '');
      });
    }
    return text.split(sep);
  },
  
  /**
   * Serialize an array into a parsable list string.
   * @param {array} arry The array to serialize.
   * @return {string} a parsable list string.
   */
  listify = corridor.listify = function(arry) {
    if (toString.call(arry) !== '[object Array]') {
      return arry;
    }
    var cat = arry.join('')
    return (
      !(/[\s,]/).test(cat) ? arry.join(' ') :      // use whitespace if none present
      cat.indexOf(',') === -1 ? arry.join(', ') :  // or commas if there are none
      arry.join("\n")                              // last resort, newline delimited
    );
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
      candidates = arrayify(elem.querySelectorAll('[data-role], [data-opts]'))
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
      log('No child "toggle" element found for toggelable.', elem);
      throw Error('No child "toggle" element found for toggelable.');
    }
    
    if (candidates.length > 1) {
      log('Multiple "toggle" elements have been found for toggleable.', elem);
      throw Error('Multiple "toggle" elements have been found for toggleable.');
    }
    
    return val(candidates[0]);
    
  },
  
  /**
   * Get the options for a given element.
   * @param {HTMLElement} elem The element to inspect.
   * @param {mixed} defs Optional defaults object to start from.
   */
  options = corridor.options = function(elem, defs) {
    var key, opts = extend({}, defs || {});
    for (key in defaults) {
      if (elem.hasAttribute('data-' + key)) {
        opts[key] = elem.getAttribute('data-' + key);
      }
    }
    return extend(opts, JSON.parse(elem.getAttribute('data-opts') || '{}'));
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
        type === 'select' ? elem.options[elem.selectedIndex].value :
        'value' in elem ? elem.value :
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
   * Deep merge one object into another.
   *
   * Notes:
   *  - does not check for hasOwnProperty.
   *  - does not deal with cyclical references (at all).
   *  - concatenates arrays (rather than trying to merge their elements).
   *  - doesn't guarantee that new cyclical relationships won't be created.
   *  - doesn't guarantee good behavior when asymentrical types are encountered.
   *
   * @param {mixed} obj The base object to merge into.
   * @param {mixed} other The other object to merge into the base.
   * @param {mixed} opts Options to use for merge (optional).
   */
  merge = corridor.merge = function(obj, other, opts) {
    
    var i, ii, key, strategy = defaults.merge;
    
    if (opts && 'merge' in opts) {
      strategy = opts.merge;
    }
    
    if (toString.call(other) === '[object Array]') {
      if (toString.call(obj) === '[object Array]') {
        if (strategy === 'concat') {
          for (i = 0, ii = other.length; i < ii; i++) {
            obj.push(other[i]);
          }
        } else if (strategy === 'extend') {
          for (i = 0, ii = other.length; i < ii; i++) {
            merge(obj[i], other[i], opts);
          }
        } else {
          if (!obj.length || other.length > 1) {
            for (i = 0, ii = other.length; i < ii; i++) {
              obj.push(other[i]);
            }
          } else {
            if (safely(obj[obj.length - 1], other[0])) {
              merge(obj[obj.length - 1], other[0], opts);
            } else {
              obj.push(other[0]);
            }
          }
        }
      } else {
        for (i = 0, ii = other.length; i < ii; i++) {
          if (i in obj && typeof obj[i] === 'object' && obj[i] !== null) {
            merge(obj[i], other[i], opts);
          } else {
            obj[i] = other[i];
          }
        }
      }
    } else {
      for (key in other) {
        if (key in obj && typeof obj[key] === 'object' && obj[key] !== null) {
          merge(obj[key], other[key], opts);
        } else {
          obj[key] = other[key];
        }
      }
    }
    
    return obj;
  },
  
  /**
   * Determine whether a candidate object can be safely merged into a base object.
   * @param {mixed} obj The base object to test for merge safety.
   * @param {mixed} other The candidiate object to check for safe merge.
   */
  safely = corridor.safely = function(obj, other) {
    
    var
      typeObj = toString.call(obj),
      typeOther = toString.call(other),
      key;
    
    if (typeObj === '[object Array]') {
      if (typeOther === '[object Array]' || typeOther === '[object Object]') {
        return true;
      }
    } else if (typeObj === '[object Object]') {
      if (typeOther === '[object Array]') {
        return true;
      }
      if (typeOther === '[object Object]') {
        for (key in other) {
          if ((key in obj) && !safely(obj[key], other[key])) {
            return false;
          }
        }
        return true;
      }
    }
    
    return false;
    
  };

}).apply(null,
  typeof module === 'object' ? [module, 'exports'] : [window, 'corridor']
);
