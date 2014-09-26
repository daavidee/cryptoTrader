var fs = require("fs");

//sum total number of files, total size
exports.codeStats = function() {
	fs.readdir('./', function (err, files) {
		if (err) console.log("an error has occurred getting list of files in root directory: " + err)
		else {
			var totalLines = 0;
			var totalSize = 0;
			var totalCalls = 0;
			var filesNoDir = []
			for(var j in files){
				var stats = fs.lstatSync(files[j])
				if (stats.isDirectory() == false) {
					filesNoDir.push(files[j])
				}
			}		
			
			for(var j in filesNoDir){
				(function(j){
						var i;
						var count = 0;
						fs.createReadStream(filesNoDir[j])
							.on('data', function(chunk) {
								for (i=0; i < chunk.length; ++i) {
									if (chunk[i] == 10) count++;
								}
							})
							.on('end', function() {
								var stats = fs.lstatSync(filesNoDir[j])
								totalLines += count
								totalSize += stats.size
								totalCalls += 1
								//console.log(filesNoDir[j] + " " + count);
								if (totalCalls == filesNoDir.length) {
									console.log(new Date().getTime() + ': lines of code: ' + totalLines)
									console.log(new Date().getTime() + ': size of code: ' + Math.round(totalSize / 1024) + " KiB")
								}
							});
				}(j))
			}

		}
	});
}

//global logging function
exports.log = function(str, err) {
	if (err) console.log(new Date().getTime() + ": " + str + " [Error]: " + err)
	else console.log(new Date().getTime() + ": " + str)
}