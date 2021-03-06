'use strict';

var User = require('../api/user/user.model');

User.count({
   email: "admin@admin.com"
}, function(err, count) {
   if (!count) {
      User.create({
         provider: 'local',
         name: 'Test User',
         email: 'test@test.com',
         password: 'test'
      }, {
         provider: 'local',
         role: 'admin',
         name: 'Admin',
         email: 'admin@admin.com',
         password: 'admin'
      }, function() {
         console.log('finished populating users');
      });
   }
});
