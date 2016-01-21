# ohcrash

[![Build Status](https://travis-ci.org/vdemedes/ohcrash.svg?branch=master)](https://travis-ci.org/vdemedes/ohcrash)

[![Browser Support](https://ci.testling.com/vdemedes/ohcrash.png)](https://ci.testling.com/vdemedes/ohcrash)

<h1 align="center">
	<br>
	<img width="300" src="media/logo.svg" alt="OhCrash">
	<br>
	<br>
	<br>
</h1>

Error reporting client for [OhCrash](https://ohcrash.com).


## Installation

```
$ npm install ohcrash --save
```


## Usage

Log in to [OhCrash](https://ohcrash.com) and [create a new project](https://ohcrash.com/projects/new).
Copy your API key and use it to initialize client library:

```js
require('ohcrash')('your api key');
```

By default, OhCrash handles:

- [uncaught exceptions](#uncaught-exceptions) (Node.js only)
- [unhandled rejections](#unhandled-rejections) (Node.js only)
- [global errors handled via `window.onerror`](#errors-in-browsers) (Browsers only)

You can customize this behavior via [API](#api).


## API

- [Configuration](#configuration)
- [Uncaught exceptions](#uncaught-exceptions)
- [Unhandled rejections](#unhandled-rejections)
- [Errors in browsers](#errors-in-browsers)
- [Reporting errors](#reporting-errors)


### Configuration

OhCrash requires API key to be present, when you initialize it:

```js
require('ohcrash')('api key');
```

It also accepts `options` object as a second argument, which can customize OhCrash's behavior.
Here's the overview of all available options with their default values:

```js
require('ohcrash')('api key', {
	// automatically catch uncaught exceptions (Node.js only)
	uncaughtExceptions: true,

	// exit after uncaught exception is reported
	exit: true,

	// automatically catch unhandled rejections (Node.js only)
	unhandledRejections: true,

	// handle window.onerror (Browsers only)
	windowOnError: true,

	// set a different server endpoint for sending errors
	endpoint: 'https://api.ohcrash.com/v1'
});
```


### Uncaught exceptions

OhCrash automatically catches [uncaught exceptions](https://nodejs.org/dist/latest-v5.x/docs/api/process.html#process_event_uncaughtexception).
To turn off handling of uncaught exceptions:

```js
require('ohcrash')('api key', {
	uncaughtExceptions: false
});
```

By default, process will exit with `1` exit code after uncaught exception is reported to ohcrash.
Exit can be prevented by setting `exit` option to `false`:

```js
require('ohcrash')('api key', {
	exit: false
});
```

If there are other listeners for `uncaughtException` event, `process.exit()` will not be called, even if `exit` is set to `true`.
In that case, OhCrash assumes other listeners will handle the exit.


### Unhandled rejections

OhCrash also catches [unhandled rejections](https://nodejs.org/dist/latest-v5.x/docs/api/process.html#process_event_unhandledrejection) by default. To turn it off:

```js
require('ohcrash')('api key', {
	unhandledRejections: false
});
```

Unlike with uncaught exceptions, process **will not** exit after unhandled rejection.


### Errors in browsers

In browsers, OhCrash sets `window.onerror` function to receive global errors.
To turn it off:

```js
require('ohcrash')('api key', {
	windowOnError: false
});
```

If `window.onerror` already contained a function before OhCrash initialized,
OhCrash will call it manually to allow multiple listeners.


### Reporting errors

It is also possible to report errors manually to OhCrash using `report(err)` function:

```js
var OhCrash = require('ohcrash')('api key');

var err = new Error('I know this error');
OhCrash.report(err).then(function () {
	// error reported
});
```

Errors can also have GitHub issue labels assigned to them:

```js
OhCrash.report(err, ['priority', 'bug', 'help wanted']);
```

Or you can assign whatever properties you want.
For example, you may assign a user's email, who got affected by this error:

```js
OhCrash.report(err, {
	user: 'john@doe.com'
});
```

If you want both labels and custom data:

```js
OhCrash.report(err, {
	labels: ['priority', 'bug', 'help wanted'],
	user: 'john@doe.com'
});
```


## Tests

```
$ npm test
$ npm run test-browser
```


## License

MIT © [Vadim Demedes](https://github.com/vdemedes)
