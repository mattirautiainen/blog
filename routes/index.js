var express = require('express');
var router = express.Router();

var models = require('../models');

var apiUser = require('./api_user');

function isAuthenticated(req,res,next) {
	if(req.session.authenticated) {
		return next();
	} else {
		res.redirect('/');
	}
}

router.all('/*', function(req, res, next) {
	if(typeof req.session.authenticated === 'undefined') {
		req.session.authenticated = false;
	}
	if(typeof req.session.username === 'undefined') {
		req.session.username = '';
	}
	if(typeof req.session.userid === 'undefined') {
		req.session.userid = -1;
	}
	next();
});

router.get('/', function(req, res, next) {
	var blogposts = [];
	var blogs = [];
	models.BlogPost.findAll().then(function(bps) {
		blogposts = bps;
		if(req.session.authenticated) {
			return apiUser.getBlogs(req.session.username);
		} else {
			return []; 
		}
	}).then(function(userblogs) {
		blogs = userblogs;
		if(req.session.authenticated) {
			req.params['username'] = req.session.username;
			return apiUser.getFollows(req,res,next);
		} else {
			return [];
		}	
	}).then(function(follows) {
		res.render('index', {
			host: req.headers.host,
			blogs: blogs,
			blogposts: blogposts,
			authenticated: req.session.authenticated,
			username: req.session.username,
			follows: follows 
		});
	});	
});

router.get('/login', function(req, res, next) {
	res.render('login', {
		host: req.headers.host,
		authenticated: req.session.authenticated
    });  
});

router.post('/login', function(req, res, next) {

	var username = req.body.username;
	var password = req.body.password;

	if(!username || !password) {
		res.status(401);
		res.end('Wrong username or password');
	}
	
	var query = {where: {username: username, password: password}};
	models.User.findOne(query).then(function(user) {
		if(!user) {
			res.status(401);
			res.end('Wrong username or password');
		} else {
			req.session.username = user.username;
			req.session.userid = user.id;
			req.session.authenticated = true;
			res.redirect('/');
		}
	});
 	
});

router.get('/logout', function(req, res, next) {
	req.session.username = '';
	req.session.userid = -1;
	req.session.authenticated = false;
	res.redirect('/');
});

router.get('/settings', function(req, res, next) {
	res.render('settings', {
		authenticated: req.session.authenticated,
		username: req.session.username
	});
});

router.post('/settings', function(req, res, next) {
	apiUser.update(req,res,next);
});

router.get('/register', function(req, res, next) {
	res.render('register', {
		authenticated: req.session.authenticated
	});
});

module.exports = router;
