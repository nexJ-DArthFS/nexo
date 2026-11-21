
'use strict';

const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const requireAuth = require('../middleware/requireAuth');
const { requirePermission } = require('../modules/access/access.service');

const router = express.Router();
const scope = () => ({ module: 'access' });

router.use(requireAuth);

// Consultar módulos
router.get('/', requirePermission('access.read', scope), async (_req, res, next) => {
  try {
    const modules = await getDB()
      .collection('modules')
      .find({})
      .sort({ name: 1 })
      .toArray();

    res.json({ success: true, modules });
  } catch (error) {
    next(error);
  }
});

// Registrar módulo
router.post('/', requirePermission('access.manage_permissions', scope), async (req, res, next) => {
  try {
    const { name, key, description = '', location = '' } = req.body;

    if (!name?.trim() || !key?.trim()) {
      return res.status(400).json({ error: 'Nombre y clave son obligatorios.' });
    }

    const module = {
      name: name.trim(),
      key: key.trim().toLowerCase(),
      description: description.trim(),
      location: location.trim(),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await getDB().collection('modules').insertOne(module);

    res.status(201).json({ success: true, module });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'El módulo ya existe.' });
    }
    next(error);
  }
});

// Activar / desactivar
router.patch('/:key/status', requirePermission('access.manage_permissions', scope), async (req, res, next) => {
  try {
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'El estado debe ser booleano.' });
    }

    const result = await getDB().collection('modules').findOneAndUpdate(
      { key: req.params.key },
      { $set: { active, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Módulo no encontrado.' });
    }

    res.json({ success: true, module: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
