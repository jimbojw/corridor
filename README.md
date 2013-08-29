# corridor

JSON/DOM data corridor.
Data binding without the fuss.

## getting corridor

corridor is just a single js file.
You can grab corridor.js out of this repo.

## Using corridor

The corridor library has only one function called `corridor()`.
This function does one of two things:

 * extract data out of a DOM heirarchy, or
 * insert data into a DOM heirarchy.

It knows how to shuttle data back and forth by looking at HTML5 data attributes on the DOM elements.

Let's take a look at how this works by using the practical example of a [`package.json`](https://npmjs.org/doc/json.html) file.
We'll build out a single-page web app for manipulating a package.json file.

To skip to the outcome of this walkthrough, see the `example.html` file.

### package.json data

For a `package.json`, you need at least the following data:

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

corridor makes it easy to write a UI that controls this data structure.
Let's start with the `name` field.
Here's the HTML you'd need:

```html
<input type="text" data-field='{"name":$$$}' />
```

The `data-field` attribute tells corridor that this `input` provides the value for the `name` property.
The `$$$` token is necessary here, it tells corridor how to insert the value.
Other than the `$$$` token, the `data-field` should contain proper JSON.

Let's try it out.
Make sure you have the `<input>` HTML on a page and the corridor library included.
Then you can call the corridor function with no arguments to extract all the data on the page.

```js
corridor(); // returns {"name":""} (or whatever you've typed in the box).
```

The first argument to corridor is the root element for the data extraction.
If you don't provide one, corridor will assume you meant to search down from the document root.

### corridor data types

By default, corridor will assume that the value provided by a field is a string.
However, you can override this by specifiying a type.

All options to corridor are done by adding a `data-opts` attribute to the node.
Let's see how this applies to the `keywords` field of a package.json.

The corridor HTML for the keywords field looks like this:

```html
<textarea data-field='{"keywords":$$$}' data-opts='{"type":"list"}'></textarea>
```

Here the `type` property indicates that we have a `list` value.
corridor will try to parse the text value of the `<textarea>` as a list of items, and will output an array.

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
<p data-field='{"dependencies":$$$}'>
  <label>
    foo:
    <select data-field='{"foo":$$$}'>
      <option value="~1.1.0">foo: version 1</option>
      <option value="~2.0.0">foo: version 2</option>
    </select>
  </label>
  <label>
    bar:
    <select data-field='{"bar":$$$}'>
      <option value="~3.5.0">bar: version 3</option>
      <option value="~4.1.0">bar: version 4</option>
    </select>
  </label>
</p>
```

The paragraph element's `data-field` attribute tells corridor that any fields under it should roll up under it when creating the data object.

Running `corridor()` on this gives us:

```js
{
  "dependencies": {
    "foo": "~1.1.0",
    "bar": "~3.5.0"
  }
}
```

Merging works best for objects like the `dependencies` object we just looked at.
But corridor can also merge arrays.

### toggling sections

You can mark sections of your UI as being toggleable using the `role` option in an element's `data-opts`.

For example, say you wanted a checkbox to control whether `keywords` were going to be included in the output.
The corridor HTML for that might look like this:

```html
<div data-opts='{"role":"toggleable"}'>
  <p>
    <label>
      <input type="checkbox" data-opts='{"role":"toggle"}' checked/>
      include keywords?
    </label>
  </p>
  <p>
    <label>
      keywords (list format):
      <textarea data-field='{"keywords":$$$}' data-opts='{"type":"list"}'></textarea>
    </label>
  </p>
</div>
```

Adding the `toggleable` role to the outer `<div>` signals to corridor that this section can be turned on and off.
The checkbox with the role `toggle` controls it.

You can nest toggleable sections inside each other.
In each case, the toggle that control the toggleable container is the nearest child.

### inserting data

Just as corridor can pull data out of the DOM, it can put the data back in as well.
This feature is still a bit experimental, there are some bugs around reinserting arrays (we're working on it).

To insert data back into the DOM, call the corridor function with a root element and a data structure object.

```js
corridor(document.body, {
  name: "foo",
  keywords: ["bar", "baz"]
});

corridor uses the same `data-field` and `data-opts` parameters to determine where data values should be inserted.

## License

See LICENSE
