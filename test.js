'use strict';

/**
 * Dependencies
 */

var Promise = require('bluebird');
var sinon = require('sinon');
var test = require('tape');

var OhCrash = require('./');


/**
 * Tests
 */

test('fail when api key is missing', function (t) {
	t.throws(function () {
		OhCrash();
	}, TypeError, 'Expected `apiKey` for OhCrash client');

	t.end();
});

test('set default endpoint', function (t) {
	var client = clientStub();

	t.is(client.endpoint, 'https://api.ohcrash.com/v1');
	t.end();
});

test('set custom endpoint', function (t) {
	var client = new OhCrash('apikey', {
		endpoint: 'my endpoint'
	});

	t.is(client.endpoint, 'my endpoint');
	t.end();
});

test('report error', function (t) {
	var client = clientStub();

	var err = new Error('Error message');
	client.report(err);

	t.true(client.send.calledOnce);
	t.true(client.send.calledOn(client));
	t.true(client.send.calledWith({
		name: err.name,
		message: err.message,
		stack: err.stack,
		metaData: {},
		props: {}
	}));
	t.end();
});

test('report error with labels', function (t) {
	var client = clientStub();

	var err = new Error('Error message');
	client.report(err, ['critical']);

	t.true(client.send.calledOnce);
	t.true(client.send.calledOn(client));
	t.true(client.send.calledWith({
		name: err.name,
		message: err.message,
		stack: err.stack,
		props: {
			labels: ['critical']
		},
		metaData: {}
	}));
	t.end();
});

test('report error with custom data', function (t) {
	var client = clientStub();

	var err = new Error('Error message');
	client.report(err, { user: 'test@test.com' });

	t.true(client.send.calledOnce);
	t.true(client.send.calledOn(client));
	t.true(client.send.calledWith({
		name: err.name,
		message: err.message,
		stack: err.stack,
		metaData: {
			user: 'test@test.com'
		},
		props: {}
	}));
	t.end();
});


/**
 * Browser-specific tests
 */

if (isBrowser()) {
	test('report error via window.onerror', function (t) {
		var onError = window.onerror = sinon.spy();

		var client = clientStub();
		client.enable();

		var err = new Error('Error message');
		window.onerror(err);

		t.true(onError.calledOnce);
		t.true(onError.calledWith(err));
		t.true(client.send.calledOnce);
		t.true(client.send.calledOn(client));
		t.true(client.send.calledWith({
			name: err.name,
			message: err.message,
			stack: err.stack,
			metaData: {},
			props: {}
		}));

		client.disable();
		t.end();
	});

	test('turn off reporting window.onerror errors', function (t) {
		var onError = window.onerror = function () {};

		var client = clientStub({ windowOnError: false });
		client.enable();

		t.is(window.onerror, onError);
		client.disable();
		t.is(window.onerror, onError);

		t.end();
	});
}


/**
 * Node.js-specific tests
 */

if (isNode()) {
	test('report uncaught exception', function (t) {
		var client = clientStub({ exit: false });
		client.enable();

		var err = new Error('Error message');
		process.emit('uncaughtException', err);

		t.true(client.send.calledOnce);
		t.true(client.send.calledOn(client));
		t.true(client.send.calledWith({
			name: err.name,
			message: err.message,
			stack: err.stack,
			metaData: {},
			props: {}
		}));

		client.disable();
		t.end();
	});

	test('turn off reporting of uncaught exceptions', function (t) {
		var client = clientStub({ uncaughtExceptions: false });
		client.enable();

		t.is(process.listeners('uncaughtException').length, 0);

		client.disable();
		t.end();
	});

	test('report unhandled rejection', function (t) {
		var client = clientStub();
		client.enable();

		var err = new Error('Error message');
		Promise.reject(err);

		setTimeout(function () {
			t.true(client.send.calledOnce);
			t.true(client.send.calledOn(client));
			t.true(client.send.calledWith({
				name: err.name,
				message: err.message,
				stack: err.stack,
				metaData: {},
				props: {}
			}));

			client.disable();
			t.end();
		}, 100);
	});

	test('turn off reporting of unhandled rejections', function (t) {
		var client = clientStub({ unhandledRejections: false });
		client.enable();

		t.is(process.listeners('unhandledRejection').length, 0);

		client.disable();
		t.end();
	});
}


/**
 * Helpers
 */

function clientStub (options) {
	var client = new OhCrash('apikey', options);
	client.send = sinon.stub().returns(Promise.resolve());

	return client;
}

function isBrowser () {
	return typeof window !== 'undefined';
}

function isNode () {
	return !isBrowser();
}
