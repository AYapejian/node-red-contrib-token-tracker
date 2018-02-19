const BaseNode = require('../../lib/base-node');

module.exports = function(RED) {
    const nodeOptions = {
        config: {
            name:     {},
            exchange: { isNode: true },
            symbol:   {}
        },
        input: {
            symbol: { messageProp: 'symbol', configProp: 'symbol' }
        }
    };

    class GetTickerNode  extends BaseNode {
        constructor(nodeDefinition) {
            super(nodeDefinition, RED, nodeOptions);
            this.exchange = RED.nodes.getNode(nodeDefinition.server);
        }

        async onInput({ parsedMessage, message }) {
            try {
                if (!parsedMessage.symbol.value) throw new Error('Cannot fetch symbol, no symbol provided as input or via config');
                message.payload = await this.nodeConfig.exchange.getTicker(parsedMessage.symbol.value);
                this.send(message);
            } catch (e) { this.error(e) }
        }
    }

    RED.nodes.registerType('get-ticker', GetTickerNode);
};
