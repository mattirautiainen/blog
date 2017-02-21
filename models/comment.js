"use strict";

module.exports = function(sequelize, DataTypes) {
  var Comment = sequelize.define("Comment", {
	text: {type: DataTypes.STRING},
	author: {type: DataTypes.STRING},
	blogpostId: {type: DataTypes.STRING}
  }, {
    classMethods: {
      associate: function(models) {
      }
    }
  });

  sequelize.sync();
  return Comment;
};