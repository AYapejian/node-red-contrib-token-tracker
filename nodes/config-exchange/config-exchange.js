const ccxt     = require('ccxt');
const BaseNode = require('../../lib/base-node');

module.exports = function(RED) {
    const httpHandlers = {
        getExchangeProviders: function (req, res, next) {
            const exchanges = ccxt.exchanges;
            return res.json(exchanges);
        }
    };

    const nodeOptions = {
        config: {
            name:        {},
            provider:    {},
            credentials: {}
        }
    };

    class ConfigExchange extends BaseNode {
        constructor(nodeDefinition) {
            super(nodeDefinition, RED, nodeOptions);
            this.nodeConfig.credentials = this.credentials;

            if (this.nodeConfig.provider) {
                const { key, secret, passphrase } = this.nodeConfig.credentials;
                if (key && secret && !passphrase) {
                    this.exchangeClient = new ccxt[this.nodeConfig.provider]({
                        apiKey: key,
                        secret: secret
                    });
                    this.hasCredentials = true;
                } else if (key && secret && passphrase) {
                    this.exchangeClient = new ccxt[this.nodeConfig.provider]({
                        apiKey:   key,
                        secret:   secret,
                        password: passphrase
                    });
                    this.hasCredentials = true;
                } else {
                    this.exchangeClient = new ccxt[this.nodeConfig.provider]();
                    this.hasCredentials = false;
                }
                this.init();
            }
        }
        async init(exchangeClient) {
            try {
                const exchangeCtx = {};
                exchangeCtx.name           = this.nodeConfig.name;
                exchangeCtx.provider       = this.nodeConfig.provider;
                exchangeCtx.hasCredentials = this.hasCredentials;

                // Depends on loading markets first
                exchangeCtx.markets     = await this.getMarkets();
                exchangeCtx.symbols     = this.exchangeClient.symbols;
                exchangeCtx.currencies  = this.exchangeClient.currencies;
                this.setOnContext(null, exchangeCtx);
            } catch (e) { throw e }
        }
        async getMarkets() {
            try {
                if (!this.markets) this.markets = await this.exchangeClient.loadMarkets();
                return this.markets;
            } catch (e) { throw e }
        }
        async getBalance() {
            return this.exchangeClient.fetchBalance();
        }

        async getOrders() {
            return this.exchangeClient.fetchOrders();
        }
        async getOrdersOpen() {
            return this.exchangeClient.fetchOpenOrders();
        }
        async getOrdersClosed() {
            return this.exchangeClient.fetchClosedOrders();
        }

        async getTicker(symbol) {
            return this.exchangeClient.fetchTicker(symbol);
        }

        get nameAsCamelcase() {
            return this.utils.toCamelCase(this.nodeConfig.name);
        }

        setOnContext(key, value) {
            let context = this.context().global.get('token-tracker') || {};
            context[this.nameAsCamelcase] = context[this.nameAsCamelcase] || {};
            if (key) {
                context[this.nameAsCamelcase][key] = value;
            } else {
                context[this.nameAsCamelcase] = Object.assign({}, context[this.nameAsCamelcase], value);
            }
            this.context().global.set('token-tracker', context);
        }

        getFromContext(key) {
            let haCtx = this.context().global.get('token-tracker');
            return (haCtx[this.nameAsCamelcase]) ? haCtx[this.nameAsCamelcase][key] : null;
        }
    }

    RED.httpAdmin.get('/token-tracker/exchange-providers', httpHandlers.getExchangeProviders.bind(this));

    RED.nodes.registerType('config-exchange', ConfigExchange, {
        credentials: {
            key:        { type: 'text'     },
            secret:     { type: 'password' },
            passphrase: { type: 'password' }
        }
    });
};
