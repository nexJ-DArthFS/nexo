
'use strict';

const { createAuditRepository } = require('./audit.repository');

const ALLOWED_RESULTS = [
  'success',
  'failure',
  'denied'
];

function createAuditService(db) {
  const repository = createAuditRepository(db);

  async function record(entry, options = {}) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('La entrada de auditoría es inválida.');
    }

    const {
      actorId = null,
      action,
      target = null,
      details = {},
      result = 'success',
      ip = null,
      userAgent = null
    } = entry;

    if (!action || typeof action !== 'string') {
      throw new Error('La acción de auditoría es obligatoria.');
    }

    if (!ALLOWED_RESULTS.includes(result)) {
      throw new Error('Resultado de auditoría inválido.');
    }

    return repository.create({
      actorId,
      action,
      target,
      details,
      result,
      ip,
      userAgent,
      createdAt: new Date()
    }, {
      session: options.session
    });
  }

  async function getRecent(options = {}) {
    return repository.findRecent({
      skip: Math.max(0, Number(options.skip) || 0),
      limit: Math.min(100, Math.max(1, Number(options.limit) || 50)),
      session: options.session
    });
  }

  async function getByActor(actorId, options = {}) {
    return repository.findByActor(actorId, {
      skip: Math.max(0, Number(options.skip) || 0),
      limit: Math.min(100, Math.max(1, Number(options.limit) || 50)),
      session: options.session
    });
  }

  async function getByTarget(type, id, options = {}) {
    return repository.findByTarget(type, id, {
      skip: Math.max(0, Number(options.skip) || 0),
      limit: Math.min(100, Math.max(1, Number(options.limit) || 50)),
      session: options.session
    });
  }

  return {
    record,
    getRecent,
    getByActor,
    getByTarget
  };
}

module.exports = {
  createAuditService
};
