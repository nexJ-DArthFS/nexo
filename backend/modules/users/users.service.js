
'use strict';

const { ObjectId } = require('mongodb');

const { createUsersRepository } = require('./users.repository');
const { createAuditService } = require('../audit/audit.service');

const ALLOWED_STATUSES = [
  'pending',
  'active',
  'suspended',
  'disabled'
];

function createUsersService(db) {
  const repository = createUsersRepository(db);
  const audit = createAuditService(db);

  function validateObjectId(id, fieldName = 'ID') {
    if (!id || !ObjectId.isValid(id)) {
      const error = new Error(`${fieldName} inválido.`);
      error.status = 400;
      throw error;
    }

    return new ObjectId(id);
  }

  async function withTransaction(callback) {
    const session = db.client.startSession();

    try {
      let result;

      await session.withTransaction(async () => {
        result = await callback(session);
      });

      return result;
    } finally {
      await session.endSession();
    }
  }

  async function getById(id) {
    const validId = validateObjectId(id);

    const user = await repository.findById(validId);

    if (!user) {
      const error = new Error('Usuario no encontrado.');
      error.status = 404;
      throw error;
    }

    return user;
  }

  async function list(options = {}) {
    const skip = Math.max(0, Number(options.skip) || 0);
    const limit = Math.min(
      100,
      Math.max(1, Number(options.limit) || 50)
    );

    const status = options.status;

    if (status && !ALLOWED_STATUSES.includes(status)) {
      const error = new Error('Estado de usuario inválido.');
      error.status = 400;
      throw error;
    }

    const filter = status ? { status } : {};

    const [users, total] = await Promise.all([
      repository.list({ skip, limit, status }),
      repository.count(filter)
    ]);

    return {
      users,
      pagination: {
        total,
        skip,
        limit
      }
    };
  }

  async function updateProfile(id, changes, actorId) {
    const userId = validateObjectId(id, 'ID de usuario');
    const actorObjectId = validateObjectId(actorId, 'ID del actor');

    const allowedChanges = {};

    if (typeof changes?.name === 'string') {
      const name = changes.name.trim();

      if (name.length < 2 || name.length > 80) {
        const error = new Error(
          'El nombre debe tener entre 2 y 80 caracteres.'
        );
        error.status = 400;
        throw error;
      }

      allowedChanges.name = name;
    }

    if (Object.keys(allowedChanges).length === 0) {
      const error = new Error('No hay cambios válidos para aplicar.');
      error.status = 400;
      throw error;
    }

    return withTransaction(async (session) => {
      const users = db.collection('users');

      const user = await users.findOne(
        { _id: userId },
        {
          projection: { passwordHash: 0 },
          session
        }
      );

      if (!user) {
        const error = new Error('Usuario no encontrado.');
        error.status = 404;
        throw error;
      }

      await users.updateOne(
        { _id: userId },
        {
          $set: {
            ...allowedChanges,
            updatedAt: new Date()
          }
        },
        { session }
      );

      await audit.record({
        actorId: actorObjectId,
        action: 'users.profile.updated',
        target: {
          type: 'user',
          id: userId
        },
        details: {
          fields: Object.keys(allowedChanges)
        }
      }, { session });

      return users.findOne(
        { _id: userId },
        {
          projection: { passwordHash: 0 },
          session
        }
      );
    });
  }

  async function updateStatus(id, status, actorId, req = {}) {
    const userId = validateObjectId(id, 'ID de usuario');
    const actorObjectId = validateObjectId(actorId, 'ID del actor');

    if (!ALLOWED_STATUSES.includes(status)) {
      const error = new Error('Estado de usuario inválido.');
      error.status = 400;
      throw error;
    }

    if (userId.equals(actorObjectId)) {
      const error = new Error(
        'No puedes modificar tu propio estado desde esta operación.'
      );
      error.status = 403;
      throw error;
    }

    return withTransaction(async (session) => {
      const users = db.collection('users');
      const roles = db.collection('roles');
      const assignments = db.collection('role_assignments');

      const user = await users.findOne(
        { _id: userId },
        {
          projection: { passwordHash: 0 },
          session
        }
      );

      if (!user) {
        const error = new Error('Usuario no encontrado.');
        error.status = 404;
        throw error;
      }

      if (user.status === status) {
        return user;
      }

      // Protección del último superadministrador activo.
      if (user.status === 'active' && status !== 'active') {
        const superAdminRole = await roles.findOne(
          { key: 'super_admin' },
          { session }
        );

        if (superAdminRole) {
          const now = new Date();

          const activeAssignmentFilter = {
            userId,
            roleId: superAdminRole._id,
            active: true,
            $or: [
              { expiresAt: null },
              { expiresAt: { $exists: false } },
              { expiresAt: { $gt: now } }
            ]
          };

          const assignment = await assignments.findOne(
            activeAssignmentFilter,
            { session }
          );

          if (assignment) {
            // Serializar modificaciones concurrentes del rol.
            await roles.updateOne(
              { _id: superAdminRole._id },
              {
                $inc: { securityVersion: 1 },
                $set: { securityUpdatedAt: now }
              },
              { session }
            );

            const activeSuperAdmins = await assignments.aggregate([
              {
                $match: {
                  roleId: superAdminRole._id,
                  active: true,
                  $or: [
                    { expiresAt: null },
                    { expiresAt: { $exists: false } },
                    { expiresAt: { $gt: now } }
                  ]
                }
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'user'
                }
              },
              { $unwind: '$user' },
              {
                $match: {
                  'user.status': 'active'
                }
              },
              {
                $group: {
                  _id: '$userId'
                }
              },
              {
                $count: 'total'
              }
            ], { session }).toArray();

            const total = activeSuperAdmins[0]?.total || 0;

            if (total <= 1) {
              const error = new Error(
                'No puedes desactivar al último superadministrador activo.'
              );
              error.status = 403;
              throw error;
            }
          }
        }
      }

      await users.updateOne(
        { _id: userId },
        {
          $set: {
            status,
            updatedAt: new Date()
          }
        },
        { session }
      );

      await audit.record({
        actorId: actorObjectId,
        action: 'users.status.updated',
        target: {
          type: 'user',
          id: userId
        },
        details: {
          previousStatus: user.status,
          newStatus: status
        },
        ip: req.ip || null,
        userAgent: req.get?.('user-agent') || null
      }, { session });

      return users.findOne(
        { _id: userId },
        {
          projection: { passwordHash: 0 },
          session
        }
      );
    });
  }

  return {
    getById,
    list,
    updateProfile,
    updateStatus
  };
}

module.exports = {
  createUsersService
};
