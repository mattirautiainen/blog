"use strict";

module.exports = function(sequelize, DataTypes) {
	var Follower = sequelize.define("Follower", {
		username: {type: DataTypes.STRING},
		blogId: {type: DataTypes.STRING}
	}, {
	classMethods: {
		associate: function(models) {
			//Follower.hasOne(models.User);
			//Follower.belongsToMany(models.Blog, {through: 'BlogFollower'});
		}
    }
	});

  sequelize.sync();
  return Follower;
};