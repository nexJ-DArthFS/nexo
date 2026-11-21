'use strict';

const express = require('express');

const requireAuth = require('../../middleware/requireAuth');

const {
  requirePermission
} = require('../access/access.service');

const {
  createUsersController
} = require('./users.controller');

const router = express.Router();

const controller = createUsersController();

const usersScope = () => ({
  module: 'users'
});

// Primera capa: comprobar autenticación y estado de la cuenta.
router.use(requireAuth);

// Segunda capa: comprobar permisos RBAC.

// Consultar todos los usuarios.
router.get(
  '/',
  requirePermission('users.read', usersScope),
  controller.list
);

// Consultar un usuario.
router.get(
  '/:id',
  requirePermission('users.read', usersScope),
  controller.getById
);

// Actualizar información de un usuario.
router.patch(
  '/:id',
  requirePermission('users.update', usersScope),
  controller.updateProfile
);

// Cambiar estado de una cuenta.
router.patch(
  '/:id/status',
  requirePermission('users.manage_status', usersScope),
  controller.updateStatus
);

module.exports = router;