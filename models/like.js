"use strict";

module.exports = function(sequelize, DataTypes) {
  var Like = sequelize.define("Like", {
	blogPostId: {type: DataTypes.STRING},
	username: {type: DataTypes.STRING}
  }, {
    classMethods: {
      associate: function(models) {
      }
    }
  });

  sequelize.sync();
  return Like;
};