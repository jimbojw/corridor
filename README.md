# corridor

**{json} &rarr; &lt;html&gt; &rarr; {json}**

Bi-directional data binding without the fuss.

## why you need corridor

Your data is in JSON, but your users interact with HTML.
corridor's only mission is to shuttle your data between your JSON and your HTML.

In a nutshell, corridor gives you the power to turn this:

```html
<fieldset name="project">
  <input type="text" name="dependencies.foo" value="~0.1.0" />
  <input type="text" name="dependencies.bar" value="~2.1.0" />
</fieldset>
```

Into this:

```js
{
  "project": {
    "dependencies": {
      "foo": "~0.1.0",
      "bar": "~2.1.0"
    }
  }
}
```

And vice versa.

### how corridor works

corridor is a runtime library, not a templating language.
It runs in the browser, easily transferring your data both ways: from form fields to JSON and (importantly) back again.

corridor uses the `name` attributes of your HTML elements to determine how a given input contributes to a JSON representation.
In most cases it'll just work, but if you need more flexibility, corridor's API options offer many points of customization.

Read the tutorial to get started, or skip to the API section for the details.

### corridor's philosophy

The corridor project philosophy boils down to these points:

 * **unobtrusive** — corridor presents just one function, has no dependencies, and causes no side-effects.
 * **intelligent** — corridor learns what to do by looking at the data, not by being told (except where you want to).
 * **clear** — corridor's code, functionality, tests, milestones and issues are all well documented and easy to follow.

Development of features, bugfixes and documentation are held to these ideals.

## getting corridor

corridor is a single js file with no dependencies.
You can get it in either of two ways:

* from github: grab [corridor.js](https://github.com/jimbojw/corridor/blob/master/src/corridor.js) out of the [corridor repo](https://github.com/jimbojw/corridor)
* from npm: 

```sh
$ npm install corridor
```

## corridor tutorial

It would be great if users could just edit JSON directly.
That way, your REST API would be all you'd need.

But unfortunately, your users interact with the Document Object Model (DOM) representation of your HTML.
Which means that it's your job to figure out how to get these two views of the data to match.

The corridor library has only one function called `corridor()`.
This function does one of two things:

 * extract data out of a DOM heirarchy (form elements), or
 * insert data into the DOM.

Let's take a look at how this works by using the practical example of a [`package.json`](https://npmjs.org/doc/json.html) file.
We'll build out a single-page web app for manipulating a package.json file.

To skip to the outcome of this walkthrough, see the `example.html` file.

### package.json example app

For a `package.json` file, you need at least the following data:

 * name - the name of the project.
 * version - the semantic version number of the project.

And you may also want the following fields:

 * keywords - an array of keywords for npm to find your package.
 * dependencies - a collection of package/version pairs.

In all, that would produce JSON something like this (values omitted):

```js
{
  "name": "",
  "version": "",
  "keywords": [],
  "dependencies": {}
}
```

Now let's put together the UI for working with this data.

### corridor fields

Let's start with the `name` field.
Here's the HTML you'd need:

```html
<input type="text" name="name" />
```

Let's try it out.
Make sure you have the `<input>` HTML on a page and the `corridor.js` library included.
Then you can call the corridor function with no arguments to extract all the data on the page.

```js
corridor(); // returns {"name":""} (or whatever you've typed in the box).
```

The first argument to corridor is the root element for the data extraction.
If you don't provide one, corridor will assume you meant to search down from the document root.

### corridor data types

By default, corridor will automatically detect the type of the value for an element.
But you can override this behavior by providing a `data-type` attribute.

Let's see how this applies to the `keywords` field of a package.json.

The HTML for the keywords field should look like this:

```html
<textarea name="keywords" data-type="list"></textarea>
```

Here the `data-type` indicates that we have a `list` value.
corridor will try to parse the text in the `<textarea>` as a list of items, and will output an array.

Let's give it a try!
With the above `<textarea>` on a page, enter the text `"abc, def"` (no quotes).
Then run corridor:

```js
JSON.stringify(corridor(), null, 2);
// produces
{
  "name": "",
  "keywords": [
    "abc",
    "def"
  ]
}
```

Supported data types include:

 * auto - default, automatically detects the type.
 * string - just treats value as a string.
 * boolean - always true or false.
 * number - parses string as a float.
 * list - parses value as a list.
 * json - treats value as valid JSON.

If you can't set `data-type` because your application already uses this attribute for something else, you can use `data-opts` instead.
Here's how it would look with `data-opts`:

```html
<textarea name="keywords" data-opts='{"type":"list"}'></textarea>
```

The `data-opts` attribute, when present, must contain valid JSON.
Note that options specified in `data-opts` will override `data-*` attributes.

Take this input for example:

```html
<input type="text" name="zip" data-type="string" data-opts='{"type":"number"}' />
```

In this case, corridor will treat the zip as a number.

### corridor field nesting

corridor will use parent elements' names to create nested structures.

For example, say we wanted to have drop-down choices for the `foo` and `bar` dependencies.
The corridor HTML for that would look something like this:

```html
<fieldset>
  <label>
    foo:
    <select name="dependencies.foo">
      <option value="~1.1.0">foo: version 1</option>
      <option value="~2.0.0">foo: version 2</option>
    </select>
  </label>
  <label>
    bar:
    <select name="dependencies.bar">
      <option value="~3.5.0">bar: version 3</option>
      <option value="~4.1.0">bar: version 4</option>
    </select>
  </label>
</p>
```

Running `corridor()` on this gives us:

```js
{
  "dependencies": {
    "foo": "~1.1.0",
    "bar": "~3.5.0"
  }
}
```

But it doesn't end there!
Since both the `foo` and `bar` select boxes live under `dependencies`, giving a `name` to the fieldset would have the same effect:

```html
<fieldset name="dependencies">
  <label>
    foo:
    <select name="foo">
      <option value="~1.1.0">foo: version 1</option>
      <option value="~2.0.0">foo: version 2</option>
    </select>
  </label>
  <label>
    bar:
    <select name="bar">
      <option value="~3.5.0">bar: version 3</option>
      <option value="~4.1.0">bar: version 4</option>
    </select>
  </label>
</p>
```

If you run corridor against this HTML, you'll get the same JSON listed above.

Merging works best for objects like the `dependencies` object we just looked at.
But corridor can also merge arrays.

### rich path names

In the last section we saw a rudimentary example of how to create nested data structures.
The range of supported names is quite rich.

These are best explained by example.
Let's say you wanted to add `authors` to your package.json form, with a separate input for each author.

The HTML for that might look like this:

```html
<fieldset>
  <label>
    first author:
    <input type="text" name="authors[]" value="your name" />
  </label>
  <label>
    second author:
    <input type="text" name="authors[]" />
  </label>
  <label>
    third author:
    <input type="text" name="authors[]" />
  </label>
</fieldset>
```

The name attribute for each author input is `authors[]`.
The trailing square brackets means that the input value should contribute to an array.

Running corridor on the above would give you JSON like this:

```js
{
  authors: [
    "your name"
  ]
}
```

Notice that there's only one element in this array.
By default, corridor makes an intelligent decision about wether to include empty values in the extracted data.
See the API documentation for how exactly it decides.

You can override the decision algorithm by specifying a `data-empty` attribute.
If you set empty to `include`, then the element's value will be included even if it's empty.
If you set empty to `omit`, then it'll be left out of the data representation if empty.

Just like with the `dependencies.foo` case from last section, here we could split up the parts of the name between the fieldset and the inputs.
E.g.

```html
<fieldset name="authors">
  <label>
    first author:
    <input type="text" name="[]" value="your name" />
```

You can mix and match dot delimited paths and square brackets to create even richer structures.

```html
<input type="text" name="stock.ticker[]symbols" value="BCOV AMZN" data-type="list" />
```

Produces this:

```js
"stock": {
  "ticker": [
    {
      "symbols": [
        "BCOV",
        "AMZN"
      ]
    }
  ]
}
```

Whitespace around key names is stripped, but whitespace inside them is preserved.
For example `name=" foo bar "` would produce an object with a `foo bar` property.

### toggling sections

You can mark sections of your UI as being toggleable using the `role` option.

For example, say you wanted a checkbox to control whether `keywords` were going to be included in the output.
The HTML for that might look like this:

```html
<fieldset data-role="toggleable">
  <p>
    <label>
      <input type="checkbox" data-role="toggle" checked/>
      include keywords?
    </label>
  </p>
  <p>
    <label>
      keywords (list format):
      <textarea name="keywords" data-type="list"></textarea>
    </label>
  </p>
</fieldset>
```

Adding the `toggleable` role to the `<frameset>` signals to corridor that this section can be turned on and off.
The checkbox with the role `toggle` controls it.

You can nest toggleable sections inside each other.
In each case, the toggle that controls the toggleable container is the nearest child.

### inserting data

This tutorial has focused largely on explaining how data flows from HTML to JSON, but corridor is great at sending data the other way as well.

To insert data back into the DOM, call the corridor function with a root element and a data structure object.

```js
corridor(document.body, {
  name: "foo",
  keywords: ["bar", "baz"]
});
```

corridor uses the same `name` and `data-*` attributes to determine where data values should be inserted.

## corridor API

The corridor API consists of two major parts: the `corridor()` function itself, and the information in the HTML it uses to make decisions about how to operate.

### corridor() function

The corridor function takes three parameters, all optional:

```
corridor([root], [data], [opts])
```

The parameters are:

 * `root` — The starting DOM element to search for named fields (defaults to `document`).
 * `data` — The plain JSON data object whose values are to be inserted.
 * `opts` — Additional options to inform how corridor makes decisions.

The presence of the second parameter, `data`, tells corridor whether it should extract data from the DOM or insert data into it.

#### extracting data

To extract data from the DOM, call `corridor()` without the second argument, or set it to null.

Examples:

```js
corridor();
corridor(root);
corridor(root, null, opts);
corridor(null, null, opts);
```

In _extract mode_, corridor will:

 * start at the `root` element,
 * find all named fields,
 * extract their values, and
 * return the plain JSON data object that results.

This is completely safe.
No side-effects are produced as a result of this operation, just data extraction.

#### inserting data

To insert data into the DOM, call `corridor()` with an object as the second argument.

Examples:

```js
corridor(null, data);
corridor(root, data);
corridor(null, data, opts);
corridor(root, data, opts);
```

In _insert mode_, corridor will:

 * start at the `root` element,
 * find all named fields,
 * set their values according to the `data` object (if a match can be found).

This will modify the values of discovered named fields where they differ from the data object representation.

#### opts

The `opts` argument, when present, affects how corridor behaves in two ways.
First, any values you specify will override the defaults for field value calculations.

For example, say you set the `type` property to `binary`:

```js
corridor(null, null, {type:'binary'});
```

This means that any fields without an explicit `type` declared will be coerced to binary values.
Fields with an explicit type (either as `data-type` or in `data-opts`) will still use their specified type though.

Secondly, some options give hints to corridor's higher level behavior.

For example, the `enabledOnly` property controls whether corridor will operate on fields that are disabled by a `toggleable` parent.
By default `enabledOnly` is set to `true`, meaning only enabled fields are included.
You could set `enabledOnly` to `false` in the opts hash to tell corridor to ignore the effects of toggleables.

Options that apply to any field are `type` and `empty`.
The `role` and `enabledOnly` options apply only to toggleable/toggle functionality.

Note that setting options via the `opts` param specifically affects the execution of the corridor function just once.
Persistent options should be stored in the HTML.

##### type option

The `type` option indicates the kind of field this is.
The type determines how corridor converts the string value of the form element into the data representation.

The recognized types are:

 * _auto_ - automatically detect the correct type based on the value (default)
 * _string_ - treat the value as a string
 * _boolean_ - coerce this value to something true/false
 * _number_ - parse this value as a number
 * _json_ - leave this value as-is (will choke if it's not actually valid JSON)
 * _list_ - parse this value as a list of values

When automatically detecting the type, corridor uses the following algorithm:

 1. attempt to parse the value as JSON, if successful, use this value
  - _Note: this covers booleans and numbers as well as richer JSON structures._
 2. otherwise treat the value as a string.

The list type will never be auto detected.

##### empty option

The `empty` option indicates whether the value should be included in the output if its value is empty.

Choices are:

 * _auto_ - automatically detect the appropriate behavior based on the circumstances (default)
 * _include_ - include the value in the output (default)
 * _omit_ - do not add the field at all

When empty is set to `auto`, corridor uses the following algorithm to between `include` and `omit`:

 * if the element has a `required` attribute, then choose `include`, otherwise,
 * if the element would contribute a value by appending to an array (ex: `name="authors[]"`), choose `omit`, otherwise,
 * if the element is a checkbox, choose `omit`.

If none of these conditions are met, then choose `include`.
With this algorithim, most of the time an empty value will contribute to the output, except in cases where you probably expect it wouldn't.

##### toggle options

Options specific to the `toggleable`/`toggle` functionality are:

 * **role** — The role that this element plays in corridor operations. Choices are:
  - _field_ - this element is a field whose value will contribute to extracted data (default)
  - _toggleable_ - this element contains fields and may be toggled on or off
  - _toggle_ - this element is a checkbox which toggles its nearest parent toggleable
 * **enabledOnly** — (boolean) When inserting/extracting, only operate on enabled fields (default: true).

### HTML API

corridor inspects the Document Object Model (DOM) at runtime to figure out how to extract and insert data.
Specificially, it looks at these things:

 * the tag name,
 * the `name` (or `data-name`) attribute, and
 * the `data-*` (or `data-opts`) attributes.

The tag name influences whether corridor considers an element to have a value, and if so, how to retrieve it.
For instance, the way you extract a value from a `<textarea>` differs from how you extract a value from a `<select>` element.

The `name` attribute is by far the most important one to corridor.
The presence of a `name` attribute (or `data-name`) tells corridor that an element should be considered for data insertion/extraction.
The content of this attribute tells corridor exactly how to shuttle data between the element's value and the data representation.

The `data-*` attributes, when present, override the default options (see the _opts_ section above).

#### name attribute

corridor uses the `name` attribute of an element to figure out how the _value_ of that element relates to the _data_ representation.

You can also use the `data-name` attribute instead.
corridor will actually check the `data-name` attribute first and use it if present, falling back to plain `name`.
This serves two purposes.

First, strictly speaking, not all HTML5 elements allow the `name` attribute.
But HTML5 doel allow `data-` prefixed attributes on any element.
If you want to assign a name to a `p` or a `div` tag, for example, you should use `data-name`.

Secondly, `data-name` supplies an alternative should your application require that the `name` field has a specific value.
If you need to keep `name` the same, but want corridor to address it by a different name value, you'd use `data-name`.

There are two formats you can use when specifying the name of an element: name format and field format.

_Note: better names for "name format" and "field format" are forthcoming._

#### name format

The name format is the more natural of the two formats.
In name format, the value resembles how you'd access a nested value inside an object in JavaScript.

For instance, say your JSON representation is this:

```js
{
  "book": {
    "title": "The Art of War"
  }
}
```

Then an input that maps to the `title` would have `name="book.title"`:

```html
<input type="text" name="book.title" value="The Art of War"/>
```

In name format, use periods to separate keys.
They can nest to arbitrary depth, e.g. `{"a":{"b":{"c":"foo"}}}` maps to the element with `name="a.b.c"`.

You can also use brackets to indicate a subkey (as opposed to using a period `.`).
For example, the following are all equivalent to `name="a.b.c"`:

 * `name="[a][b][c]"`
 * `name="a[b]c"`
 * `name="a[b].c"`
 * `name="a.b[c]"`

Whitespace is trimmed from the beginning and ending of keys, but not inside.
So `name="a b"` is different from `name="a     b"`, but all of the following are equivalent to `name="a.b.c"`:

 * `name="[ a ][ b ][ c ]"`
 * `name=" a.b.c "`
 * `name="a[b].   c"`
 * `name="a.   b[c]"`

Finally, a pair of square brackets with nothing inside (`[]`) means that the value should contribute to an array.
Consider this HTML:

```html
<input type="text" name="book.authors[]" value="Sunzi"/>
<input type="text" name="book.authors[]" value="Giles, Lionel"/>
```

With corridor, this would map to the following data representation:

```js
{
  "book": {
    "authors": [
      "Sunzi",
      "Giles, Lionel"
    ]
  }
}
```

Where you're appending to an array, you'll probably want the square brackets at the end, but this isn't strictly necessary.
Your name attribute can have additional keys and bracket pairs after the first.
Here are a few example names and the JSON data they'd map to:

```js
// <input name="authors[]name" value="Sunzi" />
{
  "authors": [
    { "name": "Sunzi" }
  ]
}
```

```js
// <input name="authors[][]" value="Sunzi" />
{
  "authors": [
    [ "Sunzi" ]
  ]
}
```

```js
// <input name="[][author]" value="Sunzi" />
[ { "author": "Sunzi" } ]
```

In most cases, using name format for your name attributes will give you what you need to correctly shuttle data between your JSON and your HTML.
However, if your JSON is quite complex, you may need to use field format for some of your elements.

#### field format

Whereas name format resembles how you'd _access_ an object in JavaScript, field format resembles how you describe an object in JavaScript—that is, JSON.

With field format, you specify how your data should appear as properly formatted JSON.
Except that you replace the value with the literal string `$$$`.

For example, consider the name format string `book.title`.
The field format version would be `{"book":{"title":$$$}}`.
Any name format string can be converted to field format, but the opposite is not always true.

Here are some name format strings and their field format equivalents:

 * `title` &rarr; `{"title":$$$}`
 * `book.title` &rarr; `{"book":{"title":$$$}}`
 * `authors[]` &rarr; `{"authors":[$$$]}`
 * `authors[]name` &rarr; `{"authors":[{"name":$$$}]}`
 * `[]` &rarr; `[$$$]`
 * `a.b.c` &rarr; `{"a":{"b":{"c":$$$}}}`

When possible, you should use the name format for your name attributes.
But there are some rare cases where field format is the better option.

#### data-opts attribute

Just as `data-*` attributes override the default options, `data-opts` can also be used to override options.
If present, the `data-opts` attribute must contain valid JSON.

For example `data-type="list"` is the same as `data-opts='{"type":"list"}'`.
When both a `data-*` attribute and a `data-opts` key have the same name (like in this list example) corridor will use the value in `data-opts`.
This way, if your application already uses a `data-*` attribute that would conflict with corridor, you can use `data-opts` instead.

## issues and feature requests

If you find any issues with corridor, or if you'd like to request a feature, please head over to the [issues page on github](https://github.com/jimbojw/corridor/issues).

Keep in mind that the more specific you are, the more likely your issue or feature is to be addressed.

## questions

If you have a question about how to use corridor, or if you're not sure if you're doing it right, go to [stackoverflow](http://stackoverflow.com/) and [ask a question](http://stackoverflow.com/questions/ask?tags=corridor).
Make sure you add the `corridor` tag to your question.

## developing corridor

If you're interested in developing corridor, great!
Start by forking [corridor on github](https://github.com/jimbojw/corridor).

Once you've forked the project, clone it using `git clone`:

```sh
$ git clone git@github.com:<YOUR_USERNAME>/corridor.git
```

The source code for corridor itself is in the `src/` directory.

corridor uses npm for packaging and deployment, so you'll need to install Node.js if you haven't already.
Once you have Node, you can pull in corridor's development dependencies:

```sh
$ npm install
```

### testing corridor

The corridor unit tests are in the `test/` directory.
corridor's unit tests are written to run in [nodeunit](https://npmjs.org/package/nodeunit) or with [QUnit](http://qunitjs.com/).

After installing the npm dependencies, you can run the corridor unit tests from the command line like this:

```sh
$ npm test
```

To run the unit tests in the browser, just open `test/index.html` and they'll run automatically.

### submitting changes

When you're satisfied with your changes, commit them and push them to your forked repository.
Then open a pull request in github by hitting the big "Pull Request" button from the main project repo page.

## License

See LICENSE
