'use strict';

var express = require('express'),
   auth = require("../../auth/auth.service"),
   CacheController = require("./cache.controller"),
   controller = require('./heroku.controller');

var router = express.Router();

router.post('/', auth.isAuthenticated(), CacheController.apps, controller.apps);
router.post('/dynos/:appId', auth.isAuthenticated(), controller.dynos);
router.post('/restart/:appId/:dynoId', auth.isAuthenticated(), controller.restart);

router.post("/config/list/:appId", auth.isAuthenticated(), CacheController.config, controller.getConfig);
router.post("/config/create/:appId", auth.isAuthenticated(), controller.setConfig);
router.post("/config/remove/:appId", auth.isAuthenticated(), controller.removeConfig);

router.post("/collaborators/list/:appId", auth.isAuthenticated(), CacheController.collaborators, controller.listCollaborators);
router.post("/collaborators/create/:appId", auth.isAuthenticated(), controller.createCollaborator);
router.post("/collaborators/show/:appId/:collaboratorId", auth.isAuthenticated(), controller.getCollaborator);
router.post("/collaborators/remove/:appId/:collaboratorId", auth.isAuthenticated(), controller.removeCollaborator);

router.post("/releases/list/:appId", auth.isAuthenticated(), CacheController.releases, controller.releases);
router.post("/releases/rollback/:appId/:releaseId", auth.isAuthenticated(), controller.rollbackRelease);

module.exports = router;
