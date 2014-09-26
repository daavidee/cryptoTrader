var fs = require("fs");

function getOnlineProxyList(callback) {
	var http = require('http');
	var options = {
		host: 'letushide.com',
		path: '/export/json/http,all,us/'
	};
	http.request(options, function(response) {
		var str = '';
		response.on('data', function (chunk) {
			str += chunk;
		});
		response.on('end', function () {
			var json = JSON.parse(str)
			callback(json)
		});
	}).end();
}

function readLocalProxyList(callback) {
	fs.readFile('./proxyList', {encoding: 'utf-8'}, function(err,data){
		if (!err){
			callback(JSON.parse(data));
		}
		else {
			console.log(err);
		}
	});
}

getLocalResponseTime() 

function getLocalResponseTime() {
	var proxy = 'local'
	var http = require('http');
	var options = {
		host: 'whatismyipaddress.com',
		path: '/'
	};
	var startTime = new Date().getTime();
	try {
		http.request(options, function(response) {
			var str = '';
			response.on('error', function (err) {
				console.log("proxy " + proxy + " failed")
				return
			});
			response.on('data', function (chunk) {
				str += chunk;
			});
			response.on('end', function () {
				var endTime = new Date().getTime();
				var t = endTime - startTime
				var search2 = str.search('http://cdn.whatismyipaddress.com/images-v4/social.png')
				if (search > -1 && search2 > -1) console.log("proxy " + proxy + " took " + t + " ms")
				else {
					console.log("proxy " + proxy + " failed")
					return
				}
				
				//console.log(str.substring(search+ 23, search + 32))
			});
		}).on('error', function(e){
			console.log("proxy " + proxy + " failed")
			return
		}).end();
	}
	catch(err) {
		console.log("proxy " + proxy + " failed")
		return
	}
}

/*
readLocalProxyList(function(json) {
	//console.log(json)
	for(var i = 0; i < 15; i++) {
		getProxyResponseTime(String(json[i].host), json[i].port)
	}
});
*/

/*
getOnlineProxyList(function(json) {
	checkProxyTime('221.10.40.234', 843)	
	for(var i = 0; i < 5; i++) {
		checkProxyTime(String(json[i].host), json[i].port)
	}
});
*/


function getProxyResponseTime(proxy, port) {
	var http = require('http');
	var options = {
		host: proxy,
		port: port,
		path: 'http://whatismyipaddress.com',
		headers: {
			Host: "whatismyipaddress.com"
	  }
	};
	var startTime = new Date().getTime();
	try {
		http.request(options, function(response) {
			var str = '';
			response.on('error', function (err) {
				console.log("proxy " + proxy + " failed")
				return
			});
			response.on('data', function (chunk) {
				str += chunk;
			});
			response.on('end', function () {
				var endTime = new Date().getTime();
				var t = endTime - startTime
				var search = str.search(proxy)
				var search2 = str.search('http://cdn.whatismyipaddress.com/images-v4/social.png')
				if (search > -1 && search2 > -1) console.log("proxy " + proxy + " took " + t + " ms")
				else {
					console.log("proxy " + proxy + " failed")
					return
				}
				
				//console.log(str.substring(search+ 23, search + 32))
			});
		}).on('error', function(e){
			console.log("proxy " + proxy + " failed")
			return
		}).end();
	}
	catch(err) {
		console.log("proxy " + proxy + " failed")
		return
	}
}


/*
var http = require('http');
var options = {
	host: 'whatismyipaddress.com',
	path: '/'
};
http.request(options, function(response) {
	var str = '';
	response.on('data', function (chunk) {
		str += chunk;
	});
	response.on('end', function () {
		var search = str.search('<!-- do not script -->')
		console.log(str.substring(search+ 23, search + 32))
	});
}).end();

*/