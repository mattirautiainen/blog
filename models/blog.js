"use strict";

module.exports = function(sequelize, DataTypes) {
  var Blog = sequelize.define("Blog", {
	name: {type: DataTypes.STRING}
  }, {
    classMethods: {
      associate: function(models) {
		Blog.belongsToMany(models.User, {through: 'BlogUser'});
		Blog.hasMany(models.BlogPost);
		//Blog.hasMany(models.Follower);
		//Blog.belongsToMany(models.Follower, {through: 'BlogFollower'});
      }
    }
  });

  sequelize.sync();
  return Blog;
};
