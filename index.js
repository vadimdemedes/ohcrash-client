'use strict';

const envName = require('env-name');
const got = require('got');

class OhCrash {
	constructor(endpoint, options) {
		this.options = Object.assign({
			internals: {},
			globalProps: {}
		}, options);

		if (!endpoint) {
			throw new TypeError('Endpoint is required');
		}

		this.endpoint = endpoint;

		this.process = this.options.internals.process || process;
		this.console = this.options.internals.console || console;

		this.handleException = this.handleException.bind(this);
		this.handleRejection = this.handleRejection.bind(this);

		if (this.options.internals.autoEnable !== false) {
			this.enable();
		}
	}

	enable() {
		if (this.options.exceptions !== false) {
			this.process.on('uncaughtException', this.handleException);
		}

		if (this.options.rejections !== false) {
			this.process.on('unhandledRejection', this.handleRejection);
		}
	}

	disable() {
		this.process.removeListener('uncaughtException', this.handleException);
		this.process.removeListener('unhandledRejection', this.handleRejection);
	}

	handleException(err) {
		const listeners = this.process.listeners('uncaughtException').length;
		const exit = this.options.exit;

		this.console.error(err.stack);

		// don't report more than one uncaught exception
		// if OhCrash is the only one listening
		if (listeners === 1) {
			if (exit !== false) {
				this.process.removeListener('uncaughtException', this.handleException);
			}
		}

		this.report(err).then(() => {
			if (listeners === 1) {
				if (exit === false) {
					return;
				}

				this.process.exit(1);
			}
		});
	}

	handleRejection(err) {
		this.console.error(err.stack);
		this.report(err);
	}

	report(err, props) {
		props = Object.assign({runtime: envName()}, this.options.globalProps, props);

		return this.send({
			name: err.name,
			message: err.message,
			stack: err.stack,
			props: props
		}).catch(err => {
			// catch error and log it without handling,
			// since it's most likely coming from OhCrash
			// to avoid infinite loop of error reporting
			this.console.log(err.stack);
		});
	}

	send(data) {
		return got(`${this.endpoint}`, {
			method: 'post',
			timeout: 3000,
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(data)
		});
	}
}

OhCrash.register = function (endpoint, options) {
	return new OhCrash(endpoint, options);
};

module.exports = OhCrash;
