const Joi     = require('joi');
const merge   = require('lodash.merge');
const selectn = require('selectn');

const utils = {
    selectn,
    merge,
    reach: (path, obj) => selectn(path, obj),
    toCamelCase(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
            if (+match === 0) return '';
            return index == 0 ? match.toLowerCase() : match.toUpperCase(); // eslint-disable-line
        });
    }
};

const DEFAULT_OPTIONS = {
    config: {
        debugenabled: {},
        name:         {},
        exchange:     { isNode: true }
    },
    input: {
        topic:   { messageProp: 'topic'   },
        payload: { messageProp: 'payload' }
    }
};

class BaseNode {
    constructor(nodeDefinition, RED, options = {}) {
        RED.nodes.createNode(this, nodeDefinition);
        this.node = this;

        this.RED            = RED;
        this.options        = merge({}, DEFAULT_OPTIONS, options);
        this._eventHandlers = _eventHandlers;
        this._internals     = _internals;
        this.utils          = utils;

        this.nodeConfig = Object.entries(this.options.config).reduce(
            (acc, [key, config]) => {
                if (config.isNode) {
                    acc[key] = this.RED.nodes.getNode(nodeDefinition[key]);
                } else if (typeof config === 'function') {
                    acc[key] = config.call(this, nodeDefinition);
                } else {
                    acc[key] = nodeDefinition[key];
                }

                return acc;
            },
            {}
        );

        this.node.on('input', this._eventHandlers.preOnInput.bind(this));
        this.node.on('close', this._eventHandlers.preOnClose.bind(this));

        const name = this.reach('nodeConfig.name');
        this.debug(`instantiated node, name: ${name || 'undefined'}`);
    }

    // Subclasses should override these as hooks into common events
    onClose(removed) {}
    onInput() {}
    send() {
        this.node.send(...arguments);
    }

    setStatus(opts = { shape: 'dot', fill: 'blue', text: '' }) {
        this.node.status(opts);
    }

    updateConnectionStatus(additionalText) {
        this.setConnectionStatus(this.isConnected, additionalText);
    }

    setConnectionStatus(isConnected, additionalText) {
        let connectionStatus = isConnected
            ? { shape: 'dot', fill: 'green', text: 'connected' }
            : { shape: 'ring', fill: 'red', text: 'disconnected' };
        if (this.hasOwnProperty('isenabled') && this.isenabled === false) {
            connectionStatus.text += '(DISABLED)';
        }

        if (additionalText) connectionStatus.text += ` ${additionalText}`;

        this.setStatus(connectionStatus);
    }

    // Hack to get around the fact that node-red only sends warn / error to the debug tab
    debugToClient(debugMsg) {
        if (!this.nodeConfig.debugenabled) return;
        for (let msg of arguments) {
            const debugMsgObj = {
                id:   this.id,
                name: this.name || '',
                msg
            };
            this.RED.comms.publish('debug', debugMsgObj);
        }
    }

    debug() {
        super.debug(...arguments);
    }

    // Returns the evaluated path on this class instance
    // ex: myNode.reach('nodeConfig.server.events')
    reach(path) {
        return selectn(path, this);
    }
}

const _internals = {
    parseInputMessage(inputOptions, msg) {
        if (!inputOptions) return;
        let parsedResult = {};

        for (let [fieldKey, fieldConfig] of Object.entries(inputOptions)) {
            // Try to load from message
            let result = {
                key:        fieldKey,
                value:      selectn(fieldConfig.messageProp, msg),
                source:     'message',
                validation: null
            };

            // If message missing value and node has config that can be used instead
            if (result.value === undefined && fieldConfig.configProp) {
                result.value = selectn(fieldConfig.configProp, this.nodeConfig);
                result.source = 'config';
            }

            if (!result.value && fieldConfig.default) {
                result.value =
                    typeof fieldConfig.default === 'function'
                        ? fieldConfig.default.call(this)
                        : fieldConfig.default;
                result.source = 'default';
            }

            // If value not found in both config and message
            if (result.value === undefined) {
                result.source = 'missing';
            }

            // If validation for value is configured run validation, optionally throwing on failed validation
            if (fieldConfig.validation) {
                const { error, value } = Joi.validate(
                    result.value,
                    fieldConfig.validation.schema,
                    { convert: true }
                );
                if (error && fieldConfig.validation.haltOnFail) throw error;
                result.validation = { error, value };
            }

            // Assign result to config key value
            parsedResult[fieldKey] = result;
        }

        return parsedResult;
    }
};

const _eventHandlers = {
    preOnInput(message) {
        try {
            const parsedMessage = _internals.parseInputMessage.call(
                this,
                this.options.input,
                message
            );

            this.onInput({
                parsedMessage,
                message
            });
        } catch (e) {
            if (e && e.isJoi) {
                this.node.warn(e.message);
                return this.send(null);
            }
            throw e;
        }
    },

    async preOnClose(removed, done) {
        this.debug(
            `closing node. Reason: ${
                removed ? 'node deleted' : 'node re-deployed'
            }`
        );
        try {
            await this.onClose(removed);
            done();
        } catch (e) {
            this.error(e.message);
        }
    }
};

module.exports = BaseNode;
