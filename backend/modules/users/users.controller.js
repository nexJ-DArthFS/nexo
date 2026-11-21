
'use strict';

const { createUsersService } = require('./users.service');
const { getDB } = require('../../config/db');

function createUsersController() {
  // Crear el servicio cuando se procesa una solicitud.
  function getService() {
    return createUsersService(getDB());
  }

  // Gestionar errores.
  function handleError(error, res, next) {
    if (error.status) {
      return res.status(error.status).json({
        error: error.message
      });
    }

    return next(error);
  }

  // LISTAR USUARIOS
  async function list(req, res, next) {
    try {
      const result = await getService().list({
        skip: req.query.skip,
        limit: req.query.limit,
        status: req.query.status
      });

      return res.json(result);
    } catch (error) {
      return handleError(error, res, next);
    }
  }

  // CONSULTAR USUARIO
  async function getById(req, res, next) {
    try {
      const user = await getService().getById(req.params.id);

      return res.json({ user });
    } catch (error) {
      return handleError(error, res, next);
    }
  }

  // ACTUALIZAR PERFIL
  async function updateProfile(req, res, next) {
    try {
      const user = await getService().updateProfile(
        req.params.id,
        req.body || {},
        req.authUser.id
      );

      return res.json({
        success: true,
        user
      });
    } catch (error) {
      return handleError(error, res, next);
    }
  }

  // ACTUALIZAR ESTADO
  async function updateStatus(req, res, next) {
    try {
      const user = await getService().updateStatus(
        req.params.id,
        req.body?.status,
        req.authUser.id,
        req
      );

      return res.json({
        success: true,
        user
      });
    } catch (error) {
      return handleError(error, res, next);
    }
  }

  return {
    list,
    getById,
    updateProfile,
    updateStatus
  };
}

module.exports = {
  createUsersController
};
