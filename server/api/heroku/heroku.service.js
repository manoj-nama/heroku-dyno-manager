'use strict';

var Heroku = require("./heroku.model"),
   request = require("request"),
   async = require("async"),
   config = require("../../config/environment"),
   Event = require("../../enum/event.enum"),
   EventEmitter = require("events").EventEmitter;

exports.apps = function (url, method, user, data) {
   var options = {
         url: 'https://api.heroku.com/apps',
         method: 'GET',
         headers: {
            'Accept': 'application/vnd.heroku+json; version=3',
            'Content-Type': 'application/json'
         }
      },
      emitter = new EventEmitter();

   if (user.accessToken) {
      options.headers.Authorization = "Bearer " + user.accessToken;
      if(url) {
         options.url += url;
         options.method = method || "GET"
      }
      if(data) {
         options.body = data;
      }
      request(options, function (err, response, body) {
         if (err) {
            return emitter.emit(Event.ERROR, err);
         }
         if (response.statusCode === 200) {
            return emitter.emit(Event.SUCCESS, JSON.parse(body));
         } else if (response.statusCode === 202) {
            return emitter.emit(Event.SUCCESS, {msg: "Request accepted"});
         }
         return emitter.emit(Event.NOT_FOUND);
      });
   } else {
      return emitter.emit(Event.NOT_FOUND);
   }

   return emitter;
};

exports.dynos = function (appId, user) {
   return exports.apps('/' + appId + '/dynos', "GET", user);
};

exports.restart = function (appId, dynoId, user) {
   return exports.apps('/' + appId + '/dynos/' + dynoId, "DELETE", user);
};

exports.listCollaborators = function (appId, user) {
   return exports.apps('/' + appId + '/collaborators', "GET", user);
};

exports.getCollaborator = function (appId, collaboratorId, user) {
   return exports.apps('/' + appId + '/collaborators/' + collaboratorId, "GET", user);
};

exports.removeCollaborator = function (appId, collaboratorId, user) {
   return exports.apps('/' + appId + '/collaborators/' + collaboratorId, "DELETE", user);
};

exports.createCollaborator = function (appId, emailId, user) {
   var data = {
      silent: false,
      user: emailId
   };
   return exports.apps('/' + appId + '/collaborators', "POST", user, data);
};

exports.getConfig = function (appId, user) {
   return exports.apps('/' + appId + '/config-vars', "GET", user);
};