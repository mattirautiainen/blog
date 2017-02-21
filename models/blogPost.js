"use strict";

module.exports = function(sequelize, DataTypes) {
  var BlogPost = sequelize.define("BlogPost", {
	blog: {type: DataTypes.STRING},
	title: {type: DataTypes.STRING},
	text: {type: DataTypes.STRING},
	author: {type: DataTypes.STRING},
	likes: {type: DataTypes.INTEGER}
  }, {
    classMethods: {
      associate: function(models) {
		//BlogPost.hasMany(models.Comment);
      }
    }
  });

  sequelize.sync();
  return BlogPost;
};
