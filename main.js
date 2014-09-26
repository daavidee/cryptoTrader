var pg = require('pg')
var webServer = require('./webServer')
var getOrderData = require('./getOrderData')
var misc = require('./misc')
var log = misc.log

var fs = require("fs");
var creds = JSON.parse(fs.readFileSync("keys", "utf8"));

log("started script")

//log code stats to console
misc.codeStats();

//frontend
webServer.runWebServer();


//get price data every 10 seconds
getOrderData.run(11000)


//update balances every hour
setInterval(putBalancesInDb, 3600000)


//update spread reported by webserver
setInterval(function() { webServer.setOpportunity( JSON.stringify(getOrderData.getCurrentSpread()) ) }, 2000)


function putBalancesInDb() {
	var tradeApi = require('./tradeApi')
	tradeApi.getTotalCadBalance(function(balances){
		var query = "INSERT INTO balances VALUES ('" + 
					balances.time + "', '" +
					balances.totalCAD + "', '" +
					JSON.stringify(balances) + "')"

		//add data to db
		var DBconString = "postgres://" + creds.postgres.user + ":" + creds.postgres.password + "@localhost/cryptoTrader"
		var db = new pg.Client(DBconString)
		db.connect(function(err) {
			if(err) return console.error('could not connect to postgres database', err)
			db.query(query, function(err, result) {
				//console.log(balances)
				if(err) return console.error('error running query', err)
				console.log(new Date().getTime() + ": added balances data to db.")
				db.end()
			});
			//console.log(balances);
		});
	})
}