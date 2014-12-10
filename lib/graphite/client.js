'use strict';

var exec = require('child_process').exec;

// new Graphite({ apiKey: '1234' }).log(count)

var Graphite = function (opts) {
	this.apiKey = opts.apiKey;
};

// Sends a set of metrics to Graphite
Graphite.prototype.log = function(count) {
	var payload = 'localhost.next-deploys.count ' + count;
	exec('curl https://' + this.apiKey + '@hostedgraphite.com/api/v1/sink --data-binary "' + payload + '\n"', function(err, stdout, stderr) {
		if (err) {
			console.log(err, stdout, stderr);
			process.exit(1);
		}
	});
};

module.exports = Graphite;
