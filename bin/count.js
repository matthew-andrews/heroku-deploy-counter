#!/usr/bin/env node
'use strict';
require('es6-promise').polyfill();
require('isomorphic-fetch');
var argv = require('minimist')(process.argv.slice(2));

var Heroku = require('heroku-client');
var heroku = new Heroku({ token: process.env.HEROKU_AUTH_TOKEN });

heroku.apps().list()
	.then(function(apps) {
		return apps.filter(function(app) {
			return /^(?:ft-)?next-/.test(app.name);
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
						return result.json();
					})
					.then(function(results) {
						return { name: app.name, version: results[0].version };
					});
			}))
	})
	.then(function(apps) {
		console.log(apps.reduce(function(count, app) {
			return app.version + count;
		}, 0) + ' total deploys');
	})
	.catch(function(err) {
		console.log(err);
	});
