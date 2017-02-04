'use strict';

const EventEmitter = require('events');
const envName = require('env-name');
const sinon = require('sinon');
const delay = require('delay');
const test = require('ava');
const OhCrash = require('./');

const customConsole = {
	log: () => {},
	error: () => {}
};

const createClient = options => {
	options = Object.assign({
		internals: {}
	}, options);

	options.internals.autoEnable = false;

	const client = new OhCrash('endpoint', options);
	client.send = sinon.stub().returns(Promise.resolve());

	return client;
};

test('fail when endpoint is missing', t => {
	t.throws(() => new OhCrash(), 'Endpoint is required');
});

test('use register() to create a client', t => {
	const client = OhCrash.register('endpoint', {
		internals: {autoEnable: false}
	});

	t.true(client instanceof OhCrash);
	t.is(client.endpoint, 'endpoint');
	t.deepEqual(client.options, {
		globalProps: {},
		internals: {autoEnable: false}
	});
});

test('report error', t => {
	const client = createClient();

	const err = new Error('Error message');
	client.report(err);

	t.true(client.send.calledOnce);
	t.true(client.send.calledWith({
		name: err.name,
		message: err.message,
		stack: err.stack,
		props: {runtime: envName()}
	}));
});

test('report error with labels', t => {
	const client = createClient();

	const err = new Error('Error message');
	client.report(err, {labels: ['critical']});

	t.true(client.send.calledOnce);
	t.true(client.send.calledWith({
		name: err.name,
		message: err.message,
		stack: err.stack,
		props: {
			runtime: envName(),
			labels: ['critical']
		}
	}));
});

test('report error with custom data', t => {
	const client = createClient();

	const err = new Error('Error message');
	client.report(err, {user: 'test@test.com'});

	t.true(client.send.calledOnce);
	t.true(client.send.calledWith({
		name: err.name,
		message: err.message,
		stack: err.stack,
		props: {
			runtime: envName(),
			user: 'test@test.com'
		}
	}));
});

test('report error with global props', t => {
	const client = createClient({
		globalProps: {
			env: 'production',
			version: '1.0.0'
		}
	});

	const err = new Error('Error message');
	client.report(err, {user: 'test@test.com'});

	t.true(client.send.calledOnce);
	t.true(client.send.calledWith({
		name: err.name,
		message: err.message,
		stack: err.stack,
		props: {
			env: 'production',
			version: '1.0.0',
			user: 'test@test.com',
			runtime: envName()
		}
	}));
});

test('auto listen to errors', t => {
	const customProcess = new EventEmitter();
	const client = new OhCrash('endpoint', {
		internals: {process: customProcess}
	});

	t.is(customProcess.listeners('uncaughtException').length, 1);
	t.is(customProcess.listeners('unhandledRejection').length, 1);

	client.disable();

	t.is(customProcess.listeners('uncaughtException').length, 0);
	t.is(customProcess.listeners('unhandledRejection').length, 0);
});

test('report uncaught exception', t => {
	const customProcess = new EventEmitter();
	const client = createClient({
		exit: false,
		internals: {
			process: customProcess,
			console: customConsole
		}
	});

	client.enable();

	const err = new Error('Error message');
	customProcess.emit('uncaughtException', err);

	t.true(client.send.calledOnce);
	t.true(client.send.calledWith({
		name: err.name,
		message: err.message,
		stack: err.stack,
		props: {runtime: envName()}
	}));

	client.disable();

	t.is(customProcess.listeners('uncaughtException').length, 0);
	t.is(customProcess.listeners('unhandledRejection').length, 0);
});

test('report only one uncaught exception if no one else is listening', async t => {
	const customProcess = new EventEmitter();
	customProcess.exit = sinon.spy();

	const client = createClient({
		internals: {
			process: customProcess,
			console: customConsole
		}
	});

	client.enable();

	const err = new Error('Error message');
	customProcess.emit('uncaughtException', err);
	customProcess.emit('uncaughtException', err);

	await delay(50);

	t.true(customProcess.exit.calledOnce);
	t.true(client.send.calledOnce);
	t.true(client.send.calledWith({
		name: err.name,
		message: err.message,
		stack: err.stack,
		props: {runtime: envName()}
	}));

	client.disable();

	t.is(customProcess.listeners('uncaughtException').length, 0);
	t.is(customProcess.listeners('unhandledRejection').length, 0);
});

test('turn off reporting of uncaught exceptions', t => {
	const customProcess = new EventEmitter();
	const client = createClient({
		exceptions: false,
		internals: {process: customProcess}
	});

	client.enable();

	t.is(customProcess.listeners('uncaughtException').length, 0);

	client.disable();

	t.is(customProcess.listeners('unhandledRejection').length, 0);
});

test('report unhandled rejection', t => {
	const customProcess = new EventEmitter();

	const client = createClient({
		internals: {
			process: customProcess,
			console: customConsole
		}
	});

	client.enable();

	const err = new Error('Error message');
	customProcess.emit('unhandledRejection', err);

	t.true(client.send.calledOnce);
	t.true(client.send.calledWith({
		name: err.name,
		message: err.message,
		stack: err.stack,
		props: {runtime: envName()}
	}));

	client.disable();

	t.is(customProcess.listeners('uncaughtException').length, 0);
	t.is(customProcess.listeners('unhandledRejection').length, 0);
});

test('turn off reporting of unhandled rejections', t => {
	const customProcess = new EventEmitter();
	const client = createClient({
		rejections: false,
		internals: {process: customProcess}
	});

	client.enable();

	t.is(customProcess.listeners('unhandledRejection').length, 0);

	client.disable();

	t.is(customProcess.listeners('uncaughtException').length, 0);
});
