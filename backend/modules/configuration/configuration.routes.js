
'use strict';

const express = require('express');

const { getDB } = require('../../config/db');
const requireAuth = require('../../middleware/requireAuth');

const {
  requirePermission
} = require('../access/access.service');

const {
  createConfigurationService
} = require('./configuration.service');

const {
  createAuditService
} = require('../audit/audit.service');

const router = express.Router();

router.use(requireAuth);

function getConfigurationService() {
  return createConfigurationService(getDB());
}

function getAuditService() {
  return createAuditService(getDB());
}

const configurationScope = () => ({
  module: 'configuration'
});

// GET /api/configuration
// Consultar configuración general.
router.get(
  '/',
  requirePermission('settings.read', configurationScope),
  async (req, res) => {
    try {
      const settings = await getConfigurationService().getAll();

      return res.json({
        success: true,
        settings
      });
    } catch (error) {
      console.error('Error al consultar configuración:', error);

      return res.status(500).json({
        success: false,
        message: 'No se pudo consultar la configuración.'
      });
    }
  }
);

// PATCH /api/configuration
// Modificar parámetros permitidos.
router.patch(
  '/',
  requirePermission('settings.update', configurationScope),
  async (req, res) => {
    try {
      const input = req.body;

      const settings = await getConfigurationService().update(input);

      const changedKeys = Object.entries(input || {})
        .flatMap(([section, values]) =>
          Object.keys(values || {}).map(
            key => `${section}.${key}`
          )
        );

      try {
        await getAuditService().record({
          actorId: req.authUser.id,
          action: 'configuration.updated',
          target: {
            type: 'system_settings',
            id: 'global'
          },
          details: {
            changedKeys
          },
          result: 'success',
          ip: req.ip,
          userAgent: req.get('user-agent') || null
        });
      } catch (auditError) {
        console.error(
          'No se pudo registrar el cambio de configuración:',
          auditError
        );
      }

      return res.json({
        success: true,
        message: 'Configuración actualizada correctamente.',
        settings
      });
    } catch (error) {
      const isValidationError =
        error.message &&
        (
          error.message.includes('configuración') ||
          error.message.includes('Sección') ||
          error.message.includes('sección') ||
          error.message.includes('parámetro') ||
          error.message.includes('maintenanceMode') ||
          error.message.includes('systemName') ||
          error.message.includes('systemDescription') ||
          error.message.includes('defaultLanguage') ||
          error.message.includes('defaultTimezone')
        );

      if (isValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      console.error('Error al actualizar configuración:', error);

      return res.status(500).json({
        success: false,
        message: 'No se pudo actualizar la configuración.'
      });
    }
  }
);

module.exports = router;
