#!/usr/bin/env node
'use strict';
require('es6-promise').polyfill();
require('isomorphic-fetch');
var util = require('util');
var platform = process.env.JENKINS_URL ? 'jenkins': 'localhost';
var Graphite = require('../lib/graphite/client');

var graphite = new Graphite({
	apiKey: process.env.HOSTEDGRAPHITE_APIKEY,
        prefix: util.format('.%s.%s.', platform, 'next-deploys')
});

var Heroku = require('heroku-client');
var heroku = new Heroku({ token: process.env.HEROKU_AUTH_TOKEN });

heroku.organizations('financial-times').apps().listForOrganization()
	.then(function(apps) {
		return apps.filter(function(app) {
			return /^(?:ft-)?next-/.test(app.name);
		}).filter(function(app) {
			return !/(?:ft-)?next-pr/.test(app.name);
		});
	})
	.then(function(apps) {
		return Promise.all(apps.map(function(app) {
				return fetch('https://api.heroku.com/apps/' + app.id + '/releases', {
					headers: {
						'Range': 'version; max=1, order=desc',
						'Accept': 'application/vnd.heroku+json; version=3',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + process.env.HEROKU_AUTH_TOKEN
					}
				})
					.then(function(result) {
						if (result.status >= 400 && result.status < 600) {
							throw new Error("Got back response from server for " + app.name, result);
						}
						return result.json();
					})
					.then(function(results) {
						return { name: app.name, version: results[0].version };
					});
			}));
	})
	.then(function(apps) {
		var count = apps.reduce(function(count, app) {
			return app.version + count;
		}, 0);
		graphite.log(count);
		console.log(count + ' total deploys');
	})
	.catch(function(err) {
		console.log(err);
		process.exit(1);
	});
