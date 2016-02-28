'use strict';

var Heroku = require("./heroku.model"),
   request = require("request"),
   async = require("async"),
   Event = require("../../enum/event.enum"),
   EventEmitter = require("events").EventEmitter;

exports.apps = function() {
   var options = {
         url: 'https://api.heroku.com/apps',
         method: 'GET',
         headers: {
            'Accept': 'application/vnd.heroku+json; version=3'
         }
      },
      tasks = [],
      emitter = new EventEmitter();

   tasks.push(function(cb) {
      exports.authorize()
         .once(Event.ERROR, function(err) {
            cb(err);
         })
         .once(Event.SUCCESS, function(data) {
            cb(null, data);
         });
   });

   async.series(tasks, function(err, resp) {
      if (err) {
         return emitter.emit(Event.ERROR, err);
      }
      if (resp[0].accessToken) {
         options.headers.Authorization = "Bearer " + resp[0].accessToken;
         request(options, function(err, resp, body) {
            if (err) {
               return emitter.emit(Event.ERROR, err);
            }
            if (resp.statusCode === 200) {
               return emitter.emit(Event.SUCCESS, JSON.parse(
                  body));
            }
            return emitter.emit(Event.NOT_FOUND);

         });
      } else {
         console.log("No accessToken found!!");
         return emitter.emit(Event.NOT_FOUND);
      }
   });

   return emitter;
};

exports.authorize = function(code) {
   var tasks = [],
      needsRefresh = false,
      emitter = new EventEmitter();

   tasks.push(function(cb) {
      Heroku.findOne().lean().exec(function(err, doc) {
         if (err) {
            console.log("Error Cannot find the heroku document",
               err);
            return cb(err);
         }
         if (doc && doc.expires <= Date.now()) {
            //token expired, get a new one
            needsRefresh = true;
         }
         return cb(null, doc);
      });
   });

   tasks.push(function(cb) {
      getAccessToken({
         refresh: needsRefresh,
         code: code,
         refreshToken: doc && doc.refreshToken || null
      }, function(err, data) {
         if (err) {
            console.log("Error getting accessToken", err);
            cb(err);
         } else {
            cb(null, data);
         }
      });
   });

   async.series(tasks, function(err, resp) {
      var doc = resp[0],
         data = resp[1];
      if (err) {
         return emitter.emit(Event.ERROR, err);
      }
      if (doc && needsRefresh) {
         Heroku.update({
            _id: doc._id
         }, {
            $set: {
               accessToken: data.access_token,
               expires: Date.now() + (data.expires_in * 1000)
            }
         }, function(err, count) {
            doc.accessToken = data.access_token;
            respond(err, doc);
         });
      } else if (code || !doc) {
         var newDoc = new Heroku({
            accessToken: data.access_token,
            expires: Date.now() + (data.expires_in * 1000),
            refreshToken: data.refresh_token
         });

         newDoc.save(respond);
      } else {
         respond(null, doc);
      }
   });

   function respond(err, resp) {
      if (err) {
         console.log("Error saving/updating heroku doc", err);
         return emitter.emit(Event.ERROR, err);
      }
      return emitter.emit(Event.SUCCESS, resp);
   }
};

function getAccessToken(options, cb) {
   var req_obj = {
         url: "https://id.heroku.com/oauth/token",
         method: "POST",
         json: true
      },
      body = {
         client_secret: "",
         grant_type: "authorization_code"
      };

   if (options.refresh) {
      body.grant_type = "refresh_token";
      body.refresh_token = options.refreshToken;
   } else {
      body.code = options.code;
   }

   req_obj.body = body;

   request(req_obj, function(err, resp, body) {
      if (err) {
         return cb(err);
      }
      if (resp.statusCode === 200) {
         return cb(null, JSON.parse(body));
      }
      return cb();
   });
}
