# corridor

**{json} &rarr; &lt;html&gt; &rarr; {json}**

Bi-directional data binding without the fuss.

## why corridor

Your data is in JSON, but your users interact with HTML.
corridor's singular mission is to shuttle your data between your JSON and your HTML.

It is a runtime library, not a templating language.
corridor runs in the browser, able to transfer your data both ways: from form fields to JSON and back again.

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
