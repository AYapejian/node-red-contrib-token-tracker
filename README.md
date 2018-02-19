# Node Red Contrib Token Tracker

Integrate with [many](https://github.com/ccxt/ccxt/wiki/Manual#exchanges) different cryptocurrency exchanges ( thanks to [ccxt](https://github.com/ccxt/ccxt/) ) from within [node-red](https://github.com/node-red/node-red)

For flow examples checkout the [flows here](https://raw.githubusercontent.com/AYapejian/node-red-contrib-token-tracker/master/_docker/node-red/root-fs/data/flows.json)

## API Access and Errors
In most cases the nodes provided here are just proxying to CCXT which in turn proxies to the Exchange API, if any errors are received they should be displayed in the node-red debug tab.  Depending on the error consulting the specific Exchange's API documentation page or the [ccxt wiki](https://github.com/ccxt/ccxt/wiki/Manual) should probably be your first stop at debugging what the issue is.

## About Security
When adding configs for an exchange you have the option to supply API credentials, some nodes require this and will be listed as `Private` below.  If you don't supply credentials only public methods for the exchange are available for use, others will throw errors.

When adding credentials to an exchange the values you enter will be stored as [node-red credentials](https://nodered.org/docs/creating-nodes/credentials) meaning they will not be exported via `export` functionality, they should also be encrypted on the filesystem in a seperate file.

---
## Included Nodes
The installed nodes have more detailed information in the node-red info pane shown when the node is selected. Below is a quick summary

### Public API Nodes

#### Get Markets

### Private API Nodes

#### Get Balance
#### Get Orders

---
# Coming Soon...

## To Implement: Public Methods
* fetchTicker
* fetchTickers
* fetchOrderBook
* fetchOHLCV
* fetchTrades

## To Implement: Private Methods
* fetchMyTrades
* createOrder
* cancelOrder

## To Enhance
* Get Balance
  * Option to omit 0 balance, enabled by default
* Get Orders
  * Option to give datetime from / to fields?
  * Option to allow orderId as input and call fetchOrder for that specific id?
