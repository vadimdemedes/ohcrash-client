'use strict';

/**
 * Dependencies
 */

var isArray = require('isarray');
var request = require('got');


/**
 * Polyfill Promise for browsers
 */

if (isBrowser()) {
	if (typeof window.Promise === 'undefined') {
		window.Promise = require('pinkie');
	}
}


/**
 * OhCrash client
 */

function OhCrash (apiKey, options) {
	if (!apiKey) {
		throw new TypeError('Expected `apiKey` for OhCrash client');
	}

	if (!(this instanceof OhCrash)) {
		var client = new OhCrash(apiKey, options);
		client.enable();

		return client;
	}

	this.options = options || {};
	this.endpoint = this.options.endpoint || 'https://api.ohcrash.com/v1';

	this._uncaughtException = this._uncaughtException.bind(this);
	this._unhandledRejection = this._unhandledRejection.bind(this);
	this._onError = this._onError.bind(this);
}

OhCrash.prototype.enable = function () {
	if (isNode()) {
		if (this.options.uncaughtExceptions !== false) {
			process.on('uncaughtException', this._uncaughtException);
		}

		if (this.options.unhandledRejections !== false) {
			process.on('unhandledRejection', this._unhandledRejection);
		}
	}

	if (isBrowser() && this.options.windowOnError !== false) {
		this._oldHandler = window.onerror;
		window.onerror = this._onError;
	}
};

OhCrash.prototype.disable = function () {
	if (isNode()) {
		if (this.options.uncaughtExceptions !== false) {
			process.removeListener('uncaughtException', this._uncaughtException);
		}

		if (this.options.unhandledRejections !== false) {
			process.removeListener('unhandledRejection', this._unhandledRejection);
		}
	}

	if (isBrowser() && this.options.windowOnError !== false) {
		window.onerror = this._oldHandler;
	}
};

OhCrash.prototype._uncaughtException = function (err) {
	console.log(err.stack);

	var client = this;

	this.report(err).then(function () {
		if (process.listeners('uncaughtException').length === 1) {
			if (client.options.exit === false) {
				return;
			}

			process.exit(1);
		}
	});
};

OhCrash.prototype._unhandledRejection = function (err) {
	console.log(err.stack);

	this.report(err);
};

OhCrash.prototype._onError = function (err) {
	console.log(err.stack);

	if (this._oldHandler) {
		this._oldHandler.call(window, err);
	}

	this.report(err);
};

OhCrash.prototype.report = function (err, props) {
	if (isArray(props)) {
		props = {
			labels: props
		};
	}

	if (!props) {
		props = {};
	}

	return this.send({
		name: err.name,
		message: err.message,
		stack: err.stack,
		props: props
	});
};

OhCrash.prototype.send = function (data) {
	var url = this.endpoint + '/errors';

	var options = {
		method: 'post',
		headers: {
			'authorization': 'Bearer ' + this.apiKey,
			'content-type': 'application/json'
		},
		body: JSON.stringify(data)
	};

	return request(url, options);
};


/**
 * Helpers
 */

function isBrowser () {
	return typeof window !== 'undefined';
}

function isNode () {
	return !isBrowser();
}

function noop () {}


/**
 * Expose `ohcrash`
 */

module.exports = OhCrash;
