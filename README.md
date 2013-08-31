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

By default, corridor will assume that the value provided by a field is a string.
However, you can override this by specifiying a type.

To give options to corridor for a particular HTML element, give it a `data-opts` attribute.
Let's see how this applies to the `keywords` field of a package.json.

The HTML for the keywords field should look like this:

```html
<textarea name="keywords" data-opts='{"type":"list"}'></textarea>
```

Here the `type` property indicates that we have a `list` value.
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

 * string - default, just treats value as a string.
 * boolean - always true or false.
 * number - parses string as a float.
 * list - parses value as a list.
 * json - treats value as valid JSON.

### corridor field nesting

The real strength of corridor emerges when you create nested structures.

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

If you run corridor in this, you'll get the same JSON listed above.

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
    <input type="text" name="authors[]" data-opts='{"empty":"omit"}' />
  </label>
  <label>
    third author:
    <input type="text" name="authors[]" data-opts='{"empty":"omit"}' />
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
That's due to the `empty:omit` option on each of the other inputs.
By default, corridor will include empty values in the output JSON it produces, but you can disable this feature by setting `empty` to `omit`.

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
<input type="text" name="stock.ticker[]symbols" value="BCOV AMZN" data-opts='{"type":"list"}' />
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

You can mark sections of your UI as being toggleable using the `role` option in an element's `data-opts`.

For example, say you wanted a checkbox to control whether `keywords` were going to be included in the output.
The HTML for that might look like this:

```html
<fieldset data-opts='{"role":"toggleable"}'>
  <p>
    <label>
      <input type="checkbox" data-opts='{"role":"toggle"}' checked/>
      include keywords?
    </label>
  </p>
  <p>
    <label>
      keywords (list format):
      <textarea name="keywords" data-opts='{"type":"list"}'></textarea>
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

corridor uses the same `name` and `data-opts` attributes to determine where data values should be inserted.

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
corridor(null, data, options);
corridor(root, data, options);
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

Secondly, some options give hints to corridor's higher level behavior.

For example, the `enabledOnly` property controls whether corridor will operate on fields that are disabled by a `toggleable` parent.
By default `enabledOnly` is set to `true`, meaning only enabled fields are included.
You could set `enabledOnly` to `false` in the opts hash to tell corridor to ignore the effects of toggleables.

Options that apply to any field are:

 * **type** — The kind of field this is. Choices are:
  - _string_ - treate the value as a string (default)
  - _boolean_ - coerce this value to something true/false
  - _number_ - parse this value as a number
  - _json_ - leave this value as-is (will choke if it's not actually valid JSON)
  - _list_ - parse this value as a list of values
 * **empty** — If a field has a falsey value, this option determines whether it still contributes to the output. Choices are:
  - _include_ - include the value in the output (default)
  - _omit_ - do not add the field at all

Options specific to the `toggleable`/`toggle` functionality are:

 * **role** — The role that this element plays in corridor operations. Choices are:
  - _field_ - this element is a field whose value will contribute to extracted data (default)
  - _toggleable_ - this element contains fields and may be toggled on or off
  - _toggle_ - this element is a checkbox which toggles its nearest parent toggleable
 * **enabledOnly** — (boolean) When inserting/extracting, only operate on enabled fields (default: true).

Keep in mind that setting options via the `opts` param specifically affects the execution of the corridor function once.
Persistent options should be stored in the HTML.

### HTML API

corridor inspects the Document Object Model (DOM) at runtime to figure out how to extract and insert data.
Specificially, it looks at these things:

 * the tag name,
 * the `name` (or `data-name`) attribute, and
 * the `data-opts` attribute.

The tag name influences whether corridor considers an element to have a value, and if so, how to retrieve it.
For instance, the way you extract a value from a `<textarea>` differs from how you extract a value from a `<select>` element.

The `name` attribute is by far the most important one to corridor.
The presence of a `name` attribute (or `data-name`) tells corridor that an element should be considered for data insertion/extraction.
The content of this attribute tells corridor exactly how to shuttle data between the element's value and the data representation.

The `data-opts` attribute, when present, contains JSON that overrides the default options (see the _opts_ section above).
`data-opts` is also used to denote elements that are `toggleable` or perform the role of a `toggle` control for a toggleable section.

#### name attribute

_TBD_

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

corridor uses npm for packaging and deployment, so you'll need to install Node.js if you haven't already.
Once you have node, you can pull in corridor's development dependencies:

```sh
$ npm install
```

After installing the dependencies, you can run the unit tests:

```sh
$ npm test
```

The source code for corridor is in the `src/` directory, and unit tests are under `test/`.
corridor's unit tests are written for [nodeunit](https://npmjs.org/package/nodeunit).

When you're satisfied with your changes, commit them and push them to your forked repository.
Then open a pull request in github by hitting the big "Pull Request" button from the main project repo page.

## License

See LICENSE
