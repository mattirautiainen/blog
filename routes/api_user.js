var express = require('express');
var router = express.Router();

var models = require('../models');

function isAuthenticated(req,res,next) {
	if(req.session.authenticated) {
		return next();
	} else {
		res.redirect('/');
	}
}

router.post('/', function(req, res, next) {
	
  var username = req.body.username;
  var name = req.body.name;
  var password = req.body.password;

  if (!username || !name || !password) {
    return res.status(400).json({error: 'InvalidInfo'});
  }
  
  var query = {where: {username: username}};
  models.User.findOne(query).then(function(user) {
    if (user) {
      return res.status(409).json({error: 'UserExists'});
    }
	else {
		models.User.create({
			username: username,
			name: name,
			password: password
		}).then(function(user) {
			models.Blog.create({
				name: username
			}).then(function(blog) {
				blog.addUser(user.id).then( function() {
					res.status = 200;
					res.redirect('/');
				});
			});
		},
		function(err) {
			return res.status(500).json({error: 'ServerError'});
		});
	}
  });
  
});

router.get('/:username', function(req, res, next) {
	var username = req.params['username'];
	var query = {where: {username: username}};
	models.User.findOne(query).then(function(user) {
		if (user) {
			return res.json({'username': user.username, 'name': user.name});
		}
		else {
			return res.status(404).json({error: 'UserNotFound'});
		}
	});
});

router.put('/:username', function(req,res,next) {
    var username = req.params['username'];
	var name = req.body.name;
	var password = req.body.password;
	
	if(req.session.username == username) {
		var query = {where: {username: username}};
		var values = {name: name, password: password};
		models.User.update(values, query).then(function(user) {
			return res.status(200).send();
		},
		function(err) {
			return res.status(500).json({error: 'ServerError'});
		});
	} else {
		return res.status(403).json({error: 'Forbidden'});
	}
	
});

router.getBlogs = function(username) {
	return new Promise(function(resolve,reject) {
		var query = {where: {username: username}};
		models.User.findOne(query).then(function(user) {
			if(user) {
				user.getBlogs().then(function(blogs) {		
					resolve(blogs);
				});
			} 
			else {
				reject(Error('userNotFound'));
			}
		});
	});
};

router.get('/:username/blogs', function(req, res, next) {
	var username = req.params['username'];
	
	router.getBlogs(username).then(function(blogs) {
		res.status(200);
		res.send(blogs);
	}, function(err) {
		return res.status(404).json({error: exception});
	});
});

router.getFollows = function(req,res,next) {
	return new Promise(function(resolve,reject) {
		var username = req.params['username'];
		var query = {where: {username: username}};
		models.Follower.findAll(query).then(function(follows) {
			resolve(follows);
		});
	});
};

router.get('/:username/follows', isAuthenticated, router.getFollows);

router.addFollow = function(req,res,next) {
	var username = req.params['username'];
	var id = req.params['id'];
	
	var query = {where: {username: username}};
	models.User.findOne(query).then(function(user) {
		if(user) {
			if(user.id != req.session.userid) {
				return res.status(403).json({error: 'Forbidden'});
			}
			query = {where: {id: id}};
			models.Blog.findOne(query).then(function(blog){
				if(blog) {
					models.Follower.create({
						blogId: id,
						username: username
					}).then(function() {
						res.status(200);
						res.redirect('back');
					});
				} else {
					return res.status(404).json({error: 'BlogNotFound'});
				}
			});
		} else {
			return res.status(404).json({error: 'UserNotFound'});
		}
	});
};

router.post('/:username/addfollow/:id', isAuthenticated, function(req,res,next) {
	router.addFollow(req,res,next);
});

router.put('/:username/follows/:id', isAuthenticated, router.addFollow);

router.deleteFollow = function(req,res,next) {
	var username = req.params['username'];
	var id = req.params['id'];
	
	var query = {where: {username: username}};
	models.User.findOne(query).then(function(user) {
		if(user) {
			query = {where: {id: id}};
			models.Blog.findOne(query).then(function(blog){
				if(blog) {
					query = {where: {username: username, blogId: id}}; 
					models.Follower.destroy(query).then(function() {
						res.status(200);
						res.redirect('back');
					});
				} else {
					return res.status(404).json({error: 'BlogNotFound'});
				}
			});
		} else {
			return res.status(404).json({error: 'UserNotFound'});
		}
	});
};

router.post('/:username/deletefollow/:id', isAuthenticated, function(req,res,next) {
	router.deleteFollow(req,res,next);
});

router.addLike = function(req,res,next) {
	var username = req.params['username'];
	var id = req.params['id'];
	
	var query = {where: {username: username}};
	models.User.findOne(query).then(function(user) {
		if(user) {
			query = {where: {id: id}};
			models.BlogPost.findOne(query).then(function(blogPost){
				if(blogPost) {
					query = {where: {blogPostId: id, username: username}};
					models.Like.findOne(query).then(function(like) {
						if(like) {
							return res.status(200).send();
						} else {
							models.Like.create({
								blogPostId: id,
								username: username
							}).then(function() {
								res.status(200);
								res.redirect('back');
							});
						}
					});
				
				} else {
					return res.status(404).json({error: 'BlogPostNotFound'});
				}
			});
		} else {
			return res.status(404).json({error: 'UserNotFound'});
		}
	});
};

router.post('/:username/addlike/:id', isAuthenticated, function(req,res,next) {
	router.addLike(req,res,next);
});

router.deleteLike = function(req,res,next) {
	var username = req.params['username'];
	var id = req.params['id'];
	
	var query = {where: {username: username}};
	models.User.findOne(query).then(function(user) {
		if(user) {
			query = {where: {id: id}};
			models.BlogPost.findOne(query).then(function(blogPost){
				if(blogPost) {
					query = {where: {blogPostId: id, username: username}};
					models.Like.destroy(query).then(function() {
						res.status(200);
						res.redirect('back');
					});
				} else {
					return res.status(404).json({error: 'BlogPostNotFound'});
				}
			});
		} else {
			return res.status(404).json({error: 'UserNotFound'});
		}
	});
}

router.post('/:username/deletelike/:id', isAuthenticated, function(req,res,next) {
	router.deleteLike(req,res,next);
});

router.update = function(req,res,next) {
	var name = req.body.name;
	var password = req.body.password;
	var username = req.session.username;
	
	var query = {where: {username: username}};
	models.User.findOne(query).then(function(user) {
		if (user) {
			var values = {name: name, password: password};
			models.User.update(values, query).then(function(user) {
				res.status(200);
				res.redirect('/');
			},
			function(err) {
				return res.status(500).json({error: 'ServerError'});
			});
		}
		else {
			return res.status(404).json({error: 'UserNotFound'});
		}
	});
};


module.exports = router;