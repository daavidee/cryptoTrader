//misc trading functions and trading wrapper functions here. the per-exchange trading functions are found in the lib directory

var log = require('./misc').log
var Cryptsy = require('./lib/api_cryptsy')
var pg = require('pg')

var marketLabels = {
	"DOGE/BTC": {
		"cryptsy": 132,
		"vircurex":{
			"currency1": "DOGE",
			"currency2": "BTC"
		},
		"bter": "doge_btc"
	}
}
var fs = require("fs");
var creds = JSON.parse(fs.readFileSync("keys", "utf8"));

exports.getAllBalances = function(callback) {
	var Vircurex = require('./lib/api_vircurex')
	var bter = require('./lib/api_bter');
	
	var balances = {
		"time": new Date().getTime(),
		"exchangeList": [],
		"doge": {},
		"btc": {}
	};
	var vircurex = new Vircurex(creds.vircurex.user, {
		'getBalance': creds.vircurex.privKey,
		'createOrder': creds.vircurex.privKey,
		'releaseOrder': creds.vircurex.privKey,
		'deleteOrder': creds.vircurex.privKey,
		'readOrder': creds.vircurex.privKey,
		'readOrders': creds.vircurex.privKey,
		'readOrderExecutions': creds.vircurex.privKey
	});
	
	function checkIfDone (balances) {
		if (Object.keys(balances.doge).length == 3) {
			callback(balances)
		}
	}
	
	vircurex.getBalances(function(err, data) {
		if(!err) {
			//console.log(data)
			balances.exchangeList.push("vircurex")
			balances.doge.vircurex = data.balances.DOGE.balance
			balances.btc.vircurex = data.balances.BTC.balance
			checkIfDone(balances);
		}
		else {
			console.log(new Date().getTime() + ": error getting vircurex balance.  " + err);
		}	
	});

	bter.getFunds({ API_KEY: creds.bter.pubKey, SECRET_KEY: creds.bter.privKey }, function(err, data) {
		if(err) {
			console.log(new Date().getTime() + ": error getting bter balance. " + err);
		}
		else {
			//console.log(data)
			balances.exchangeList.push("bter")
			balances.doge.bter = data.available_funds.DOGE
			balances.btc.bter =  data.available_funds.BTC
			checkIfDone(balances);
		}
	});
	
	var cryptsy = new Cryptsy(creds.cryptsy.pubKey, creds.cryptsy.privKey)
	cryptsy.api('getinfo', null, function (err, data) {
		if (err) {
			console.log(new Date().getTime() + ": error getting cryptsy balance. " + err);
		} 
		else {
			//console.log(data)
			balances.doge.cryptsy = data.balances_available.DOGE
			balances.btc.cryptsy = data.balances_available.BTC
			balances.exchangeList.push("cryptsy")
			checkIfDone(balances);
		}
	});
}


//average trading price across exchanges
exports.getAvgPrice = function(callback){
	var DBconString = "postgres://" + creds.postgres.user + ":" + creds.postgres.password + "@localhost/cryptoTrader"
	var db = new pg.Client(DBconString)
	db.connect(function(err) {
		if(err) return console.error('could not connect to postgres database', err)
		db.query('SELECT * FROM prices2 ORDER BY time DESC LIMIT 1;', function(err, result) {
			if(err) return console.error('error running query', err)
			//console.log(JSON.stringify(result.rows[0]))
			db.end()
			var avgPrice = 0
			for (var i = 0;i < result.rows[0].orders.exchangeList.length ; i++) {
				var exchange = result.rows[0].orders.exchangeList[i]
				avgPrice += parseFloat(result.rows[0].orders[exchange].sells.price[0])
			}
			avgPrice = Math.round(avgPrice / result.rows[0].orders.exchangeList.length * 100000000) / 100000000
			callback(avgPrice)
		});
	});
}
exports.cadToUsdRate = function(callback){
	var http = require('http');
	var options = {
		host: 'www.freecurrencyconverterapi.com',
		path: '/api/convert?q=USD-CAD&compact=y'
	};
	http.request(options, function(response) {
		var str = '';
		response.on('data', function (chunk) {
			str += chunk;
		});
		response.on('end', function () {
			try {
				var json = JSON.parse(str)
				callback(json["USD-CAD"].val);
			}
			catch(err){
				callback(-1);
			}
		});
	}).end();
}
exports.usdToBtcRate = function(callback){
	var http = require('https');
	var options = {
		host: 'api.bitcoinaverage.com',
		path: '/ticker/USD/'
	};
	http.request(options, function(response) {
		var str = '';
		response.on('data', function (chunk) {
			str += chunk;
		});
		response.on('end', function () {
			//console.log(str)
			var json = JSON.parse(str)
			callback(json["last"]);
		});
	}).end();
}

exports.getTotalCadBalance = function(callback){
	exports.cadToUsdRate(function(cadUsdExRate){
		exports.getAvgPrice(function(avgPrice){
			exports.usdToBtcRate(function(usdBtcExRate){
				exports.getAllBalances(function(balances){
					balances.usdBtcExRate = usdBtcExRate
					balances.avgDogePrice = avgPrice
					balances.cadUsdExRate = cadUsdExRate
					var total = 0
					for (var i = 0;i < balances.exchangeList.length ; i++) {
						var exchange = balances.exchangeList[i]
						total += parseFloat( balances.btc[exchange] )
						total += parseFloat( balances.doge[exchange] ) * avgPrice
					}
					var totalCAD = total * usdBtcExRate * cadUsdExRate
					balances.totalCAD = totalCAD.toString()
					callback(balances)
				})
			})
		})
	})
}

function putOrderInDb(order) {
	var query = "INSERT INTO transactions VALUES ('"	+ 
				order.timeCompleted + "', '" +
				order.transactionId + "', '" +
				JSON.stringify(order) + "')"
				
	//add data to db
	var DBconString = "postgres://" + creds.postgres.user + ":" + creds.postgres.password + "@localhost/cryptoTrader"
	var db = new pg.Client(DBconString)	
	db.query(query, function(err, result) {
		if(err) console.log('error adding transaction to db', err)
		console.log(new Date().getTime() + ": added order data to transactions db.")
		db.end()
	});
	//console.log(query)
}

var __sampleOrder = [{
	"timeCreated": new Date().getTime(),
	"type": "sell", //sell, buy, delete
	"exchange": "bter",
	"tickerPair": "DOGE/BTC",
	"price": 0.00000163,
	"quantity": 700,
	"transactionId": "filled after successful completion of createOrder",
	"timeCompleted": "filled after successful completion of createOrder"
}]

exports.createOrder = function(orders) {
	console.log(orders)
	for (var j = 0; j < orders.length; j++) {
		(function(j){
			if (orders[j].exchange == "cryptsy") {
				var options = { 
					"marketid": marketLabels[orders[j].tickerPair].cryptsy, 
					"ordertype": orders[j].type, 
					"quantity": orders[j].quantity, 
					"price": orders[j].price 
				};
				var cryptsy = new Cryptsy(creds.cryptsy.pubKey, creds.cryptsy.privKey)
				cryptsy.api('createorder', options, function (err, data) {
					if (err) {
						console.log(err)
					} 
					else {
						orders[j].transactionId = data.orderid
						orders[j].timeCompleted = new Date().getTime()
						putOrderInDb(orders[j])
					}
				});
			}
			else if (orders[j].exchange == "vircurex") {
				var vircurex = new Vircurex(creds.vircurex.user, {
					'getBalance': creds.vircurex.privKey,
					'createOrder': creds.vircurex.privKey,
					'releaseOrder': creds.vircurex.privKey,
					'deleteOrder': creds.vircurex.privKey,
					'readOrder': creds.vircurex.privKey,
					'readOrders': creds.vircurex.privKey,
					'readOrderExecutions': creds.vircurex.privKey
				});

				vircurex.createReleasedOrder(orders[j].type, orders[j].quantity, marketLabels[orders[j].tickerPair].vircurex.currency1, orders[j].price, marketLabels[orders[j].tickerPair].vircurex.currency2, function(err, data) {
					if(!err) {
						//console.log(data)
						orders[j].transactionId = data.orderid
						orders[j].timeCompleted = new Date().getTime()
						putOrderInDb(orders[j])
					}
					else {
						console.log(new Date().getTime() + ": error making vircurex order.  " + JSON.stringify(err));
					}	
				});
			}
			else if (orders[j].exchange == "bter") {
				var bter = require('./lib/api_bter')
				var options = {
					API_KEY: creds.bter.pubKey, 
					SECRET_KEY: creds.bter.privKey, 
					PAIR: marketLabels[orders[j].tickerPair].bter,
					TYPE: orders[j].type,
					RATE: orders[j].price,
					AMOUNT: orders[j].quantity
				}
				bter.placeOrder(options, function(err, data) {
					if(err) {
						console.log(new Date().getTime() + ": error putting bter order. " + err);
					}
					else {
						setTimeout(function(){
							bter.getOrderList(options, function(err, data) {
								if(err) {
									console.log(new Date().getTime() + ": error putting bter order. " + err);
								}
								else {
									var newestTransactionId = 0;
									for (var i = 0; i < data.orders.length; i++) {
										if (data.orders[i].id > newestTransactionId) newestTransactionId = data.orders[i].id
									}
									orders[j].transactionId = newestTransactionId
									orders[j].timeCompleted = new Date().getTime()
									putOrderInDb(orders[j])
								}
							});
						}, 5500) //a 5500 msec timer used to grab the transaction id. it is not returned upon initial creation...
					}
				});
			}
		}(j))
	}
}
exports.checkArbitrageTrade = function(bestSpread) {
	//console.log(bestSpread)
	//sample
	var __bestSpread = {
		"spread":-999999999,
		"buyFromExchange": {
			//"exchange":,
			//"price":,
			//"quantity":
		},
		"sellToExchange": {
			//"exchange":,
			//"price":,
			//"quantity":
		}
	}

	
	var minSpread = 0.8 //amount in %
	var maxSpread = 15 //amount in %, larger is likely an error
	
	
	var maxTradeQty = 1000 //max amount to trade in DOGE
	var maxTradeQtySpread = 20 //max % spread above maxTradeQty
		
	maxTradeQty = maxTradeQty +  Math.floor(Math.random() * (maxTradeQty * maxTradeQtySpread/100))
	
	
	
	if (bestSpread.spread < minSpread) return
	if (bestSpread.spread > maxSpread) {
		log('spread was found > ' + maxSpread)
		return
	}
	
	var tradeQty = bestSpread.buyFromExchange.quantity
	if (bestSpread.sellToExchange.quantity < tradeQty) tradeQty = bestSpread.sellToExchange.quantity
	if (tradeQty > maxTradeQty) tradeQty = maxTradeQty
	
	//make orders object
	var orders = [{
		"timeCreated": new Date().getTime(),
		"type": "buy", //sell, buy, delete
		"exchange": bestSpread.buyFromExchange.exchange,
		"tickerPair": "DOGE/BTC",
		"price": bestSpread.buyFromExchange.price,
		"quantity": tradeQty
	},
	{
		"timeCreated": new Date().getTime(),
		"type": "sell", //sell, buy, delete
		"exchange": bestSpread.sellToExchange.exchange,
		"tickerPair": "DOGE/BTC",
		"price": bestSpread.sellToExchange.price,
		"quantity": tradeQty
	}]
	log(tradeQty + " DOGE traded from " + bestSpread.buyFromExchange.exchange + " to " + bestSpread.sellToExchange.exchange + " at a spread of " + bestSpread.spread)
	exports.createOrder(orders)
}
