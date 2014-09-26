var pg = require('pg')
var Cryptsy = require('./lib/api_cryptsy')
var Vircurex = require('./lib/api_vircurex')
var bter = require('./lib/api_bter');
var getCryptsyOrderData = require('./api_cryptsy_orders').getCryptsyOrderData;

var fs = require("fs");
var creds = JSON.parse(fs.readFileSync("keys", "utf8"));

var currentSpread = {"default": "no data yet"}

exports.getCurrentSpread = function() { return currentSpread }
exports.run = function (interval) {
	setInterval(updatePrices, interval)
}

var DBconString = "postgres://" + creds.postgres.user + ":" + creds.postgres.password + "@localhost/cryptoTrader"
var db = new pg.Client(DBconString)
db.connect(function(err) {
	if(err) return console.error('could not connect to postgres database', err)
	db.query('SELECT NOW() AS "theTime"', function(err, result) {
		if(err) return console.error('error running query', err)
		console.log(new Date().getTime() + ": getOrderData: test query to postgres database successful")
		//console.log(result.rows[0].theTime)
		//db.end()
	});
});


function putOrderDataInDb(dbInput) {
	var query = "INSERT INTO prices2 VALUES ('"	+ 
				dbInput.time + "', '" +
				dbInput.market + "', '" +
				dbInput.bestSpread.spread + "', '" +
				JSON.stringify(dbInput) + "')"
				
	//add data to db					
	db.query(query, function(err, result) {
		if(err) return console.error('error running query', err)
		console.log(new Date().getTime() + ": added price data to db. best spread: " + dbInput.bestSpread.spread + "%")

	});
	//console.log(query)
};

function checkIfDone (dbInput) {
	var numExchanges = dbInput.exchangeList.length
	if (numExchanges == 2) { //cryptsy and bter
		//calc Spread
		var bestSpread = {
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
				
		for (var j = 0;j < numExchanges; j++) {
			var compExchange = dbInput.exchangeList[j]
			for (var i = 0;i < numExchanges; i++) {
				var otherExchange = dbInput.exchangeList[i]
				var spread = Math.round(((dbInput[otherExchange].buys.price[0] / dbInput[compExchange].sells.price[0]) - 1) * 10000)/100
				if (bestSpread.spread < spread) {
					bestSpread.spread = spread
					bestSpread.buyFromExchange.exchange = compExchange
					bestSpread.buyFromExchange.price = dbInput[compExchange].sells.price[0]
					bestSpread.buyFromExchange.quantity = dbInput[compExchange].sells.quantity[0]
					bestSpread.sellToExchange.exchange = otherExchange
					bestSpread.sellToExchange.price = dbInput[otherExchange].buys.price[0]
					bestSpread.sellToExchange.quantity = dbInput[otherExchange].buys.quantity[0]
				}
				//console.log(compExchange + " sell to " + otherExchange + " buy comparison:     " + dbInput[compExchange].sells.price[0] + "/" + dbInput[otherExchange].buys.price[0] + " spread: " + spread + "%" )
			}
		}
		
		//console.log("     ")
		//console.log(bestSpread)
	
		dbInput.bestSpread = bestSpread
		currentSpread = bestSpread //update frontend var
		putOrderDataInDb(dbInput)
		
		
		//make arbitrage trade if favourable
		var tradeApi = require('./tradeApi')
		tradeApi.checkArbitrageTrade(bestSpread)
		if (bestSpread.spread > 0.8) {
			console.log(dbInput.raw.bter)
			console.log(dbInput.raw.cryptsy)
		}
	}
}

function exchangeDataJSON() {
	var data = {
		"time": new Date().getTime(),
		"buys": {
			"price": [],
			"quantity": []
		},
		"sells": {
			"price": [],
			"quantity": []
		}
	}
	return data
}

function updatePrices() {

	var dbInput = {
		"time": new Date().getTime(),
		"market": "DOGE/BTC",
		"exchangeList": [],
		"raw": {
		}
	};
	
	//grab data from exchanges

	//grab data from bter
	var API_KEY = 'YOUR_API_KEY', SECRET_KEY = 'YOUR_SECRET_KEY';
	bter.getDepth({ CURR_A: 'doge', CURR_B: 'btc' }, function(err, orderData) {
		if(err) {
			console.log(dbInput.time + ": " + err);
		}
		else {
			var asksLen = orderData.asks.length || -1
			var bterData = exchangeDataJSON()
			//console.log(orderData)
			
			var depth = 3
			if (orderData.bids.length < 3) depth = orderData.bids.length
			if (orderData.asks.length < 3) depth = orderData.asks.length
			
			for (var i=0;i<depth;i++) {
				bterData.buys.price[i] = orderData.bids[i][0] || -1
				bterData.buys.quantity[i] = orderData.bids[i][1] || -1
				bterData.sells.price[i] = orderData.asks[asksLen - 1 - i][0] || -1
				bterData.sells.quantity[i] = orderData.asks[asksLen - 1 - i][1] || -1
			}
			dbInput.raw.bter = orderData
			//console.log(dbInput.raw.bter)
			dbInput.bter = bterData;
			dbInput.exchangeList.push("bter")
			checkIfDone(dbInput);
		}
	});
	
	//grab data from vircurex
	/* not trading on vircurex right now
	var vircurex = new Vircurex('YourUsername')
	vircurex.getOrders('doge', 'btc', function(err, orderData) {
		if (err) {
			console.log(dbInput.time + ": " + err);
		}
		else {
			var vircurexData = exchangeDataJSON()
			for (var i=0;i<4;i++)
			{
				vircurexData.buys.price[i] = orderData.bids[i][0] || -1
				vircurexData.buys.quantity[i] = orderData.bids[i][1] || -1
				vircurexData.sells.price[i] = orderData.asks[i][0] || -1
				vircurexData.sells.quantity[i] = orderData.asks[i][1] || -1
			}

			dbInput.vircurex = vircurexData;
			dbInput.exchangeList.push("vircurex")
			checkIfDone(dbInput);
		}	
	});
	*/

	//grab data from cryptsy
	getCryptsyOrderData(132, function(cryptsyData) {
		//console.log(cryptsyData)
		dbInput.raw.cryptsy = cryptsyData
		//console.log(dbInput.raw.cryptsy)
		dbInput.cryptsy = cryptsyData;
		dbInput.exchangeList.push("cryptsy")
		
		//console.log(dbInput)
		checkIfDone(dbInput);
	});
}