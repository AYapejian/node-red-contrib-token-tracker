const BaseNode = require('../../lib/base-node');

module.exports = function(RED) {
    const nodeOptions = {
        config: {
            name:     {},
            exchange: { isNode: true }
        }
    };

    class GetMarketNode  extends BaseNode {
        constructor(nodeDefinition) {
            super(nodeDefinition, RED, nodeOptions);
            this.exchange = RED.nodes.getNode(nodeDefinition.server);
        }

        async onInput({ message }) {
            try {
                message.payload = await this.nodeConfig.exchange.getMarkets();
                this.send(message);
            } catch (e) { this.error(e) }
        }
    }

    RED.nodes.registerType('get-market', GetMarketNode);
};
