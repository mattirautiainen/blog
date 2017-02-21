"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    username: {type: DataTypes.STRING},
	name: {type: DataTypes.STRING},
	password: {type: DataTypes.STRING}
  }, {
    classMethods: {
      associate: function(models) {
        // Tässä voi assosioida malleja toisiinsa
        // http://sequelize.readthedocs.org/en/latest/docs/associations/
        //
        // Tyyliin
        // User.hasMany(models.BlogPost);
		User.belongsToMany(models.Blog, {through: 'BlogUser'});
		User.hasMany(models.BlogPost);
      }
    }
  });

  //User.sync();
  sequelize.sync();
  return User;
};
