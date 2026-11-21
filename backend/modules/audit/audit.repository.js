
'use strict';

const { ObjectId } = require('mongodb');

// ======================================================
// REPOSITORIO DE AUDITORÍA
// ======================================================

function createAuditRepository(db) {
  const collection = db.collection('audit_logs');

  // ====================================================
  // CREAR REGISTRO
  // ====================================================

  async function create(entry, options = {}) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('El registro de auditoría es inválido.');
    }

    const document = {
      ...entry,
      createdAt: entry.createdAt || new Date()
    };

    const insertOptions = {};

    if (options.session) {
      insertOptions.session = options.session;
    }

    const result = await collection.insertOne(
      document,
      insertOptions
    );

    return {
      ...document,
      _id: result.insertedId
    };
  }

  // ====================================================
  // BUSCAR POR ACTOR
  // ====================================================

  async function findByActor(actorId, options = {}) {
    if (!ObjectId.isValid(actorId)) {
      throw new Error('Identificador de actor inválido.');
    }

    const id = new ObjectId(actorId);

    return collection.find(
      { actorId: id },
      {
        session: options.session || undefined
      }
    )
      .sort({ createdAt: -1 })
      .skip(Math.max(0, Number(options.skip) || 0))
      .limit(Math.min(100, Math.max(1, Number(options.limit) || 50)))
      .toArray();
  }

  // ====================================================
  // BUSCAR POR DESTINO
  // ====================================================

  async function findByTarget(targetType, targetId, options = {}) {
    if (
      typeof targetType !== 'string' ||
      !targetType.trim() ||
      !ObjectId.isValid(targetId)
    ) {
      throw new Error('Destino de auditoría inválido.');
    }

    return collection.find(
      {
        'target.type': targetType,
        'target.id': new ObjectId(targetId)
      },
      {
        session: options.session || undefined
      }
    )
      .sort({ createdAt: -1 })
      .skip(Math.max(0, Number(options.skip) || 0))
      .limit(Math.min(100, Math.max(1, Number(options.limit) || 50)))
      .toArray();
  }

  // ====================================================
  // BUSCAR REGISTROS RECIENTES
  // ====================================================

  async function findRecent(options = {}) {
    return collection.find(
      {},
      {
        session: options.session || undefined
      }
    )
      .sort({ createdAt: -1 })
      .skip(Math.max(0, Number(options.skip) || 0))
      .limit(Math.min(100, Math.max(1, Number(options.limit) || 50)))
      .toArray();
  }

  // ====================================================
  // CONTAR REGISTROS
  // ====================================================

  async function count(filter = {}, options = {}) {
    return collection.countDocuments(
      filter,
      {
        session: options.session || undefined
      }
    );
  }

  return {
    create,
    findByActor,
    findByTarget,
    findRecent,
    count
  };
}

module.exports = {
  createAuditRepository
};
