<h1 align="center">
	<br>
	<img width="200" src="https://cdn.rawgit.com/vadimdemedes/ohcrash-client/master/media/logo.svg" alt="OhCrash">
	<br>
	<br>
	<br>
</h1>

[![Build Status](https://travis-ci.org/vadimdemedes/ohcrash-client.svg?branch=master)](https://travis-ci.org/vadimdemedes/ohcrash-client)

Error reporting client for [OhCrash](https://github.com/vadimdemedes/ohcrash) microservice.
OhCrash is a tiny microservice, that creates issues on GitHub for all reported errors.
Learn more at [OhCrash](https://github.com/vadimdemedes/ohcrash) repository.


## Installation

```
$ npm install ohcrash-client --save
```


## Usage

Set up an [OhCrash microservice](https://github.com/vadimdemedes/ohcrash) and deploy it.
There's no hosted version, so a URL to your own server is required.

```js
require('ohcrash').register('https://my-ohcrash.now.sh');
```

That's it, from now on uncaught exceptions and unhandled rejections will be reported to the server.
Client's behavior can be customized via [options](#configuration).


## Configuration

Client accepts an `options` object as a second argument, which can customize some of its behavior.

```js
require('ohcrash').register('https://my-ohcrash.now.sh', {
	// auto catch uncaught exceptions (default: `true`)
	exceptions: true,

	// exit after uncaught exception is reported (default: `true`)
	exit: true,

	// auto catch unhandled rejections (default: `true`)
	rejections: true,

	// properties that all errors inherit (default: `{}`)
	// useful for sending values like app environment and version
	globalProps: {
		env: process.env.NODE_ENV,
		version: '1.0.0'
	}
});
```


## Custom reporting

It is also possible to report errors manually by using `report()`.

```js
const ohcrash = require('ohcrash').register('https://my-ohcrash.now.sh');

const err = new Error('I know this error');
await ohcrash.report(err);
// error reported
```

Errors can also have GitHub issue labels assigned to them:

```js
ohcrash.report(err, {
	labels: ['priority', 'bug', 'help wanted']
});
```

Any additional properties can be assigned as well, they will be included in the GitHub issue.
For example, error could have user's email assigned to it:

```js
ohcrash.report(err, {
	user: 'john@doe.com'
});
```


## License

MIT © [Vadim Demedes](https://github.com/vadimdemedes)
