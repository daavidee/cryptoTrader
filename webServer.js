//the frontend

var log = require("./misc.js").log;

var fs = require("fs");
var creds = JSON.parse(fs.readFileSync("keys", "utf8"));

var currentOpportunity = "no"

exports.setOpportunity = function(str) {
	currentOpportunity = str
}

exports.runWebServer = function() {
	var pg = require('pg')
	var http = require("http"),
		url = require("url"),
		path = require("path"),
		fs = require("fs")
	http.createServer(function(request, response) {
		var uri = url.parse(request.url).pathname
		if (uri.slice(-1) == "/") uri += '/index.html'
		var filename = path.join(process.cwd(), "www", uri);
		var contentTypesByExtension = {
			'.html': "text/html",
			'.css':  "text/css",
			'.js':   "text/javascript"
		};
	 
		//console.log(new Date().getTime() + ": attempting to serve " + filename)
		
		if (uri == "/getBalances") {
			var tradeApi = require('./tradeApi')
			tradeApi.getTotalCadBalance(function(balances){
				response.writeHead(200, {"Content-Type": "text/plain"});
				response.write(balances.totalCAD);
				response.end();
			})
		}
		else if (uri == "/currentOpportunity") {
			response.writeHead(200, {"Content-Type": "text/plain"});
			response.write(currentOpportunity);
			response.end();
		}
		else if (uri == "/getTickerHistory") {
			var DBconString = "postgres://" + creds.postgres.user + ":" + creds.postgres.password + "@localhost/cryptoTrader"
			var db = new pg.Client(DBconString)
			log("web request for 48hr ticker history")
			db.connect(function(err) {
				log("connected to db")
				if(err) return console.error('could not connect to postgres database', err)
				db.query('SELECT * FROM prices2 ORDER BY time DESC LIMIT 17280', function(err, result) {
					log("successfully queried db")
					if(err) return console.error('error running query', err)
					
					response.writeHead(200, {"Content-Type": "text/plain"});
					response.write(JSON.stringify(result));
					response.end();
					db.end()
					//console.log("done")
				});
			});
		}
		else {
			//console.log(filename)
			//if (fs.statSync(filename).isDirectory()) filename += '/index.html';
			fs.exists(filename, function(exists) {
				if(!exists) {
					response.writeHead(404, {"Content-Type": "text/plain"});
					response.write("404 Not Found\n");
					response.end();
					return;
				}
				fs.readFile(filename, "binary", function(err, file) {
					if(err) {
						response.writeHead(500, {"Content-Type": "text/plain"});
						response.write(err + "\n");
						response.end();
						return;
					}
					var headers = {};
					var contentType = contentTypesByExtension[path.extname(filename)];
					if (contentType) headers["Content-Type"] = contentType;
					response.writeHead(200, headers);
					response.write(file, "binary");
					response.end();
				});
			});
		}
	}).listen(80);
	console.log( new Date().getTime() + ": web server started");
}