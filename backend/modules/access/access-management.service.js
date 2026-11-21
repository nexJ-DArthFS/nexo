
'use strict';

const { ObjectId } = require('mongodb');

const { createAuditService } = require('../audit/audit.service');

const {
  isAssignmentActive,
  isValidScope,
  isRoleScopeAllowed
} = require('./access.service');

function createAccessManagementService(db) {
  if (!db || typeof db.collection !== 'function') {
    throw new Error('Se requiere una conexión válida a MongoDB.');
  }

  const assignments = db.collection('role_assignments');
  const users = db.collection('users');
  const roles = db.collection('roles');
  const audit = createAuditService(db);

  function createError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  function parseObjectId(value, label) {
    if (
      typeof value !== 'string' ||
      !ObjectId.isValid(value) ||
      value.length !== 24
    ) {
      throw createError(`${label} inválido.`);
    }

    return new ObjectId(value);
  }

  function normalizeScope(scope) {
    if (!isValidScope(scope)) {
      throw createError('El alcance proporcionado no es válido.');
    }

    if (scope.type === 'global') {
      return {
        type: 'global',
        module: null,
        resourceType: null,
        resourceId: null
      };
    }

    if (scope.type === 'module') {
      return {
        type: 'module',
        module: scope.module.trim(),
        resourceType: null,
        resourceId: null
      };
    }

    return {
      type: 'resource',
      module: null,
      resourceType: scope.resourceType.trim(),
      resourceId: String(scope.resourceId).trim()
    };
  }

  function parseExpiration(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const expiration = new Date(value);

    if (Number.isNaN(expiration.getTime())) {
      throw createError('La fecha de expiración no es válida.');
    }

    if (expiration <= new Date()) {
      throw createError('La fecha de expiración debe ser futura.');
    }

    return expiration;
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

  async function getActiveUser(userId, session) {
    const user = await users.findOne(
      { _id: userId },
      { session }
    );

    if (!user) {
      throw createError('Usuario no encontrado.', 404);
    }

    if (user.status !== 'active') {
      throw createError(
        'No se pueden asignar roles a una cuenta que no está activa.',
        409
      );
    }

    return user;
  }

  async function getActiveRole(roleId, session) {
    const role = await roles.findOne(
      {
        _id: roleId,
        active: { $ne: false }
      },
      { session }
    );

    if (!role) {
      throw createError('El rol no existe o está inactivo.', 404);
    }

    return role;
  }

  async function getAssignment(assignmentId, session) {
    const assignment = await assignments.findOne(
      { _id: assignmentId },
      { session }
    );

    if (!assignment) {
      throw createError('Asignación no encontrada.', 404);
    }

    return assignment;
  }

  async function protectSuperAdmin(role, assignment, session) {
    if (role.key !== 'super_admin') {
      return;
    }

    const now = new Date();

    if (!isAssignmentActive(assignment, now)) {
      return;
    }

    // Serializa las operaciones concurrentes sobre este rol.
    await roles.updateOne(
      { _id: role._id },
      {
        $inc: { securityVersion: 1 },
        $set: { securityUpdatedAt: now }
      },
      { session }
    );

    const result = await assignments.aggregate([
      {
        $match: {
          roleId: role._id,
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

    if ((result[0]?.total || 0) <= 1) {
      throw createError(
        'No puedes retirar o desactivar al último superadministrador activo.',
        403
      );
    }
  }

  async function assignRole(data, actorId, request = {}) {
    const userId = parseObjectId(data?.userId, 'ID de usuario');
    const roleId = parseObjectId(data?.roleId, 'ID de rol');
    const actorObjectId = parseObjectId(actorId, 'ID del actor');

    const scope = normalizeScope(data?.scope);
    const expiresAt = parseExpiration(data?.expiresAt);

    return withTransaction(async (session) => {
      const user = await getActiveUser(userId, session);
      const role = await getActiveRole(roleId, session);

      if (!isRoleScopeAllowed(role.key, scope)) {
        throw createError(
          'El alcance seleccionado no está permitido para este rol.'
        );
      }

      const now = new Date();

      const existing = await assignments.findOne(
        {
          userId,
          roleId,
          active: true,
          $or: [
            { expiresAt: null },
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: now } }
          ]
        },
        { session }
      );

      if (existing) {
        throw createError(
          'El usuario ya tiene una asignación activa de este rol.',
          409
        );
      }

      const assignment = {
        userId,
        roleId,
        scope,
        active: true,
        expiresAt,
        assignedAt: now,
        assignedBy: actorObjectId,
        createdAt: now,
        updatedAt: now
      };

      const result = await assignments.insertOne(
        assignment,
        { session }
      );

      const createdAssignment = {
        ...assignment,
        _id: result.insertedId
      };

      await audit.record({
        actorId: actorObjectId,
        action: 'access.role_assigned',
        target: {
          type: 'role_assignment',
          id: result.insertedId
        },
        details: {
          userId,
          roleId,
          roleKey: role.key,
          scope,
          expiresAt
        },
        ip: request.ip || null,
        userAgent: request.get?.('user-agent') || null
      }, { session });

      return {
        assignment: createdAssignment,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email
        },
        role: {
          id: role._id.toString(),
          key: role.key,
          name: role.name
        }
      };
    });
  }

  async function updateAssignment(
    assignmentId,
    changes,
    actorId,
    request = {}
  ) {
    const id = parseObjectId(
      assignmentId,
      'ID de asignación'
    );

    const actorObjectId = parseObjectId(actorId, 'ID del actor');

    const allowedFields = ['scope', 'expiresAt'];

    if (
      !changes ||
      typeof changes !== 'object' ||
      Array.isArray(changes) ||
      !Object.keys(changes).some(key => allowedFields.includes(key)) ||
      Object.keys(changes).some(key => !allowedFields.includes(key))
    ) {
      throw createError(
        'Solo puedes modificar el alcance o la fecha de expiración.'
      );
    }

    return withTransaction(async (session) => {
      const assignment = await getAssignment(id, session);

      if (!isAssignmentActive(assignment)) {
        throw createError(
          'No puedes modificar una asignación inactiva o vencida.',
          409
        );
      }

      const role = await getActiveRole(assignment.roleId, session);
      const updatedFields = {};
      const previousValues = {};

      if (Object.prototype.hasOwnProperty.call(changes, 'scope')) {
        const scope = normalizeScope(changes.scope);

        if (!isRoleScopeAllowed(role.key, scope)) {
          throw createError(
            'El alcance seleccionado no está permitido para este rol.'
          );
        }

        previousValues.scope = assignment.scope;
        updatedFields.scope = scope;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'expiresAt')) {
        const expiresAt = parseExpiration(changes.expiresAt);

        previousValues.expiresAt = assignment.expiresAt ?? null;
        updatedFields.expiresAt = expiresAt;
      }

      const now = new Date();

      await assignments.updateOne(
        { _id: id, active: true },
        {
          $set: {
            ...updatedFields,
            updatedAt: now,
            updatedBy: actorObjectId
          }
        },
        { session }
      );

      await audit.record({
        actorId: actorObjectId,
        action: 'access.role_assignment_updated',
        target: {
          type: 'role_assignment',
          id
        },
        details: {
          roleKey: role.key,
          previousValues,
          newValues: updatedFields
        },
        ip: request.ip || null,
        userAgent: request.get?.('user-agent') || null
      }, { session });

      return assignments.findOne(
        { _id: id },
        { session }
      );
    });
  }

  async function revokeAssignment(
    assignmentId,
    actorId,
    request = {}
  ) {
    const id = parseObjectId(
      assignmentId,
      'ID de asignación'
    );

    const actorObjectId = parseObjectId(actorId, 'ID del actor');

    return withTransaction(async (session) => {
      const assignment = await getAssignment(id, session);

      if (!isAssignmentActive(assignment)) {
        throw createError(
          'La asignación ya está inactiva o vencida.',
          409
        );
      }

      const role = await getActiveRole(assignment.roleId, session);

      await protectSuperAdmin(role, assignment, session);

      const now = new Date();

      await assignments.updateOne(
        {
          _id: id,
          active: true
        },
        {
          $set: {
            active: false,
            revokedAt: now,
            revokedBy: actorObjectId,
            updatedAt: now
          }
        },
        { session }
      );

      await audit.record({
        actorId: actorObjectId,
        action: 'access.role_assignment_revoked',
        target: {
          type: 'role_assignment',
          id
        },
        details: {
          userId: assignment.userId,
          roleId: assignment.roleId,
          roleKey: role.key,
          previousScope: assignment.scope
        },
        ip: request.ip || null,
        userAgent: request.get?.('user-agent') || null
      }, { session });

      return assignments.findOne(
        { _id: id },
        { session }
      );
    });
  }

  return {
    assignRole,
    updateAssignment,
    revokeAssignment
  };
}

module.exports = {
  createAccessManagementService
};
