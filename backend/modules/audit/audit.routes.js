
'use strict';

const express = require('express');

const requireAuth = require('../../middleware/requireAuth');
const { requirePermission } = require('../access/access.service');
const { createAuditService } = require('./audit.service');
const { getDB } = require('../../config/db');

const router = express.Router();

router.use(requireAuth);

const auditScope = () => ({
  module: 'audit'
});

// GET /api/audit
router.get(
  '/',
  requirePermission('audit.read', auditScope),
  async (req, res, next) => {
    try {
      const audit = createAuditService(getDB());

      const records = await audit.getRecent({
        skip: req.query.skip,
        limit: req.query.limit
      });

      return res.json({
        success: true,
        records,
        totalReturned: records.length
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
