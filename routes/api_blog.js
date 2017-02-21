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

function isAuthorized(req,res,next) {
	if(req.session.authenticated) {
		var blogid = req.params['id'];
		var username = req.session.username;
		apiUser.getBlogs(username).then(function(blogs) {
			for(var i = 0 ; i < blogs.length ; ++i) {
				var blog = blogs[i];
				if(blog.id == blogid) {
					next();
				}
			}
		}, function(err) {
			res.redirect('/');
		});		
		
	} else {
		res.redirect('/');
	}
}

router.getFollowers = function(req, res, next) {
	return new Promise(function(resolve,reject) {
		var id = req.params['id'];
		var query = {where: {id: id}};
		models.Blog.findOne(query).then(function(blog) {
			if (blog.length != 0) {
				query = {where: {blogId: id}};
				models.Follower.findAll(query).then(function(followers) {
					resolve(followers);
				});
			}
			else {
				reject({error: 'BlogNotFound'});
			}
		});
	});
};

router.post('/', isAuthenticated, function(req, res, next) {
	var name = req.body.name;
	var userid = req.session.userid;
	if(!name) {
		return res.status(400).json({error: 'InvalidName'});
	}
	models.Blog.create({
		name: name
	}).then(function(blog) {
		blog.addUser(userid).then( function() {
			var msg = {'id': blog.id};
			res.status = 201;
			res.redirect('/');
		});
	});
});

router.get('/:id', function(req, res, next) {

	var id = req.params['id'];
	var query = {where: {username: id}};
  
	models.User.findOne(query).then(function(user) {
		if(user) {
			next();
		}
	});
	
	query = {where: {id: id}};
  
  models.Blog.findOne(query).then(function(blog) {
    if (blog) {
		var bps = [];
		var busers = [];
		var authorized = false;
		models.BlogPost.findAll().then(function(blogposts) {
			for(var i = blogposts.length-1 ; i >= 0 ; --i) {
				if(blogposts[i].blog == blog.id) {
					bps.push(blogposts[i]);
				}
			}
			return blog.getUsers();
		}).then(function(users) {
			busers = users;
			for(var i = 0 ; i < users.length ; ++i) {
				if(users[i].id == req.session.userid) {
					authorized = true;
					break;
				}
			}
			return router.getFollowers(req,res,next);
		}).then(function(followers) {
			res.status = 200;
			res.render('blogpage', {
				blogposts: bps,
				blog: blog,
				authorized: authorized,
				authenticated: req.session.authenticated,
				username: req.session.username,
				users: busers,
				followers: followers
			});
		});
		
    }
    else {
      return res.status(404).json({error: 'BlogNotFound'});
    }
  });
});

router.delete('/:id', function(req, res, next) {
	authRequired(req,res,'deleteBlog');
});

router.grantPermission = function(req,res,next) {
	var id = req.params['id'];
	var username = req.params['username'];
	var query = {where: {id: id}};
	models.Blog.findOne(query).then(function(blog) {
		if(blog) {
			query = {where: {username: username}};
			models.User.findOne(query).then(function(user) {
				if(user) {
					blog.addUser(user.id).then(function() {
						res.status = 200;
						res.redirect('back');
					});
				} else {
					return res.status(404).json({error: 'UserNotFound'});
				}
			});
		} else {
			return res.status(404).json({error: 'BlogNotFound'});
		}
	});
}

router.put('/:id/author/:username', isAuthorized, router.grantPermission);

router.post('/:id/adduser', isAuthorized, function(req, res,next) {
	req.params['username'] = req.body.username;
	router.grantPermission(req,res,next);
});

router.revokePermission = function(req,res,next) {

	var id = req.params['id'];
	var username = req.params['username'];
	
	var query = {where: {id: id}};
	models.Blog.findOne(query).then(function(blog) {
		if(blog) {
			query = {where: {username: username}};
			models.User.findOne(query).then(function(user) {
				if(user) {
					blog.removeUser(user).then(function() {
						res.status = 200;
						res.redirect('back');
					});
				} else {
					return res.status(404).json({error: 'UserNotFound'});
				}
			});
		} else {
			return res.status(404).json({error: 'BlogNotFound'});
		}
	});
}

router.delete('/:id/author/:username', router.revokePermission);

router.post('/:id/deleteuser', function(req,res,next) {
	req.params['username'] = req.body.username;
	router.revokePermission(req,res,next);
});

router.get('/:id/posts', function(req, res, next) {
	var id = req.params['id'];
	var query = {where: {blog: id}};
	models.BlogPost.findAll(query).then(function(blogposts) {
		var msg = {ids: []};
		if (blogposts.length != 0) {
			for(var i = blogposts.length-1; i >= 0; i--) {
				var postId = blogposts[i].id;
				var title = blogposts[i].title;
				var text = blogposts[i].text;
				var author = blogposts[i].author;
				msg.ids.push({"id": postId, "title": title, "text": text, "author": author});
				if(i == blogposts.length-11) {
					break;
				}
			}
		}
		res.status(200);
		return res.send(msg.ids);
	});
});

router.post('/:id/posts', isAuthorized, function(req, res, next) {
	var title = req.body.title;
	var text = req.body.text;
	var id = req.params['id'];

	if (!title || !text) {
		return res.status(400).json({error: 'InvalidInfo'});
	}
  
	models.BlogPost.create({
		blog: id,
		title: title,
		text: text,
		author: req.session.username,
		likes: 0
	}).then(function(blogpost) {
		res.status = 201;
		res.redirect('back');
	});
});



router.get('/:id/followers', router.getFollowers);

router.get('/:username', function(req, res, next) {
	return res.status(200).send();
});


module.exports = router;