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

router.get('/:id', function(req,res,next) {
    var id = req.params['id'];
	
	var query = {where: {id: id}};
	models.BlogPost.findOne(query).then(function(blogpost) {
		if(blogpost) {
			query = {where: {blogpostId: id}}; 
			models.Comment.findAll(query).then(function(comments) {
				query = {where: {blogPostId: id}};
				models.Like.findAll(query).then(function(likes) {
					res.status(200);
					res.render('blogpostpage', {
						blogpost: blogpost,
						authenticated: req.session.authenticated,
						username: req.session.username,
						comments: comments,
						likes: likes
					});
				});
				
			});
		} else {
			return res.status(404).json({error: 'BlogPostNotFound'});
		}
	});
});

router.get('/:id/comments', function(req,res,next) {
    var id = req.params['id'];
	var query = {where: {blogpostId: id}};
	models.Comment.findAll(query).then(function(comments) {
		var msg = {ids: []};
		for(var i = comments.length-1; i >= 0; --i) {
			msg.ids.push({"id": comments[i].id, 
						  "text": comments[i].text,
					      "author": comments[i].author});
		}
		res.status(200);
		return res.send(msg.ids);
	});
});


router.post('/:id/comments', isAuthenticated, function(req,res,next) {
	var username = req.session.username;
	var id = req.params['id'];
	var text = req.body.text;
	if(!text) {
		return res.status(400).json({error: 'InvalidComment'});
	}
	var query = {where: {id: id}};
	models.BlogPost.findOne(query).then(function(blogpost) {
		if(blogpost) {
			models.Comment.create({
				text: text,
				blogpostId: id,
				author: username
			}).then(function(comment) {
				res.status(200);
				res.redirect('back');
				//return res.status(201).json({'id': comment.id});
			});
		} else {
			return res.status(404).json({error: 'BlogPostNotFound'});
		}
	});
});

module.exports = router;