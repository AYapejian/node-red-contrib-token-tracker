const BaseNode = require('../../lib/base-node');

module.exports = function(RED) {
    const nodeOptions = {
        config: {
            name:      {},
            exchange:  { isNode: true },
            ordertype: {}
        }
    };

    class GetOrdersNode  extends BaseNode {
        constructor(nodeDefinition) {
            super(nodeDefinition, RED, nodeOptions);
            this.exchange = RED.nodes.getNode(nodeDefinition.server);
        }

        async onInput({ message }) {
            try {
                const ordertype = this.nodeConfig.ordertype;
                let results     = {};

                if (ordertype === 'open') {
                    results = await this.nodeConfig.exchange.getOrdersOpen();
                } else if (ordertype === 'closed') {
                    results = await this.nodeConfig.exchange.getOrdersClosed();
                } else {
                    results.open   = await this.nodeConfig.exchange.getOrdersOpen();
                    results.closed = await this.nodeConfig.exchange.getOrdersClosed();
                }
                message.payload = results;
                this.send(message);
            } catch (e) { this.error(e) }
        }
    }

    RED.nodes.registerType('get-orders', GetOrdersNode);
};
