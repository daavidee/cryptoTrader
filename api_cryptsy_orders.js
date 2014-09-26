//cryptsy's public API is slow so this implements the same "private" API used on their website

var log = require("./misc").log

function getCryptsySellOrders(market, callback) {
	var http = require('https');
	var options = {
		host: 'www.cryptsy.com',
		path: '/json.php?file=ajaxsellorderslistv2_' + market + '.json'
	};
	http.request(options, function(response) {
		var str = '';
		response.on('data', function (chunk) {
			str += chunk;
		});
		response.on('end', function () {
			//console.log(str)
			try {
				var json = JSON.parse(str)
				//console.log(json)
				callback(json)
			}
			catch(err) {
				log('error grabbing sell order data from cryptsy: ' + err)
			}
		});
	}).end();
}
function getCryptsyBuyOrders(market, callback) {
	var http = require('https');
	var options = {
		host: 'www.cryptsy.com',
		path: '/json.php?file=ajaxbuyorderslistv2_' + market + '.json'
	};
	http.request(options, function(response) {
		var str = '';
		response.on('data', function (chunk) {
			str += chunk;
		});
		response.on('end', function () {
			//console.log(str)
			try {
				var json = JSON.parse(str)
				//console.log(json)
				callback(json)
			}
			catch(err) {
				log('error grabbing buy order data from cryptsy: ' + err)
			}
		});
	}).end();
}

exports.getCryptsyOrderData = function(market, callback) {
	getCryptsyBuyOrders(market, function(buyOrders) {
		getCryptsySellOrders(market, function(sellOrders) {
			var cryptsyData = {
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
			for (var i=0;i<3;i++)
			{
				cryptsyData.buys.price[i] = buyOrders.aaData[i][0] || -1
				cryptsyData.buys.quantity[i] = buyOrders.aaData[i][1] || -1
				cryptsyData.sells.price[i] = sellOrders.aaData[i][0] || -1
				cryptsyData.sells.quantity[i] = sellOrders.aaData[i][1] || -1
			}
			callback(cryptsyData)
		});
	});
}