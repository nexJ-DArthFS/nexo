
'use strict';

const { ObjectId } = require('mongodb');
const { getDB } = require('../../config/db');

// ======================================================
// POLÍTICA DE ALCANCES POR ROL
// ======================================================

const ROLE_ALLOWED_SCOPES = Object.freeze({
  super_admin: ['global'],
  admin: ['global'],
  module_manager: ['module'],
  moderator: ['resource'],
  user: ['global']
});

// ======================================================
// VALIDACIÓN DE IDENTIFICADORES
// ======================================================

function toObjectId(value) {
  if (value instanceof ObjectId) {
    return value;
  }

  if (
    typeof value !== 'string' ||
    !ObjectId.isValid(value) ||
    value.length !== 24
  ) {
    throw new Error('Identificador de usuario inválido.');
  }

  return new ObjectId(value);
}

// ======================================================
// VALIDACIÓN DE ASIGNACIONES
// ======================================================

function isAssignmentActive(assignment, now = new Date()) {
  if (!assignment || assignment.active !== true) {
    return false;
  }

  if (
    assignment.expiresAt === null ||
    assignment.expiresAt === undefined
  ) {
    return true;
  }

  const expiration = new Date(assignment.expiresAt);

  if (Number.isNaN(expiration.getTime())) {
    return false;
  }

  return expiration > now;
}

// ======================================================
// VALIDACIÓN DE ESTRUCTURA DE ALCANCES
// ======================================================

function isValidScope(scope) {
  if (
    !scope ||
    typeof scope !== 'object' ||
    Array.isArray(scope)
  ) {
    return false;
  }

  if (scope.type === 'global') {
    return true;
  }

  if (scope.type === 'module') {
    return (
      typeof scope.module === 'string' &&
      scope.module.trim().length > 0
    );
  }

  if (scope.type === 'resource') {
    return (
      typeof scope.resourceType === 'string' &&
      scope.resourceType.trim().length > 0 &&
      scope.resourceId !== undefined &&
      scope.resourceId !== null &&
      String(scope.resourceId).trim().length > 0
    );
  }

  return false;
}

// ======================================================
// VALIDACIÓN DE ALCANCES PERMITIDOS POR ROL
// ======================================================

function isRoleScopeAllowed(roleKey, scope) {
  if (!isValidScope(scope)) {
    return false;
  }

  const allowedScopes = ROLE_ALLOWED_SCOPES[roleKey];

  if (!allowedScopes) {
    return false;
  }

  return allowedScopes.includes(scope.type);
}

// ======================================================
// VALIDACIÓN DE DESTINOS
// ======================================================

function isValidTarget(target) {
  return (
    target !== null &&
    typeof target === 'object' &&
    !Array.isArray(target)
  );
}

// ======================================================
// COMPROBACIÓN DE ALCANCES
// ======================================================

function scopeAllows(scope, target = {}) {
  if (
    !isValidScope(scope) ||
    !isValidTarget(target)
  ) {
    return false;
  }

  // Alcance global.
  if (scope.type === 'global') {
    return true;
  }

  // Alcance por módulo.
  if (scope.type === 'module') {
    return (
      typeof target.module === 'string' &&
      target.module.trim().length > 0 &&
      scope.module === target.module
    );
  }

  // Alcance por recurso.
  if (scope.type === 'resource') {
    if (
      typeof target.resourceType !== 'string' ||
      !target.resourceType.trim() ||
      target.resourceId === undefined ||
      target.resourceId === null
    ) {
      return false;
    }

    return (
      scope.resourceType === target.resourceType &&
      String(scope.resourceId) === String(target.resourceId)
    );
  }

  return false;
}

// ======================================================
// OBTENER ASIGNACIONES ACTIVAS
// ======================================================

async function getUserAssignments(db, userId) {
  const id = toObjectId(userId);
  const now = new Date();

  const assignments = await db.collection('role_assignments')
    .find({
      userId: id,
      active: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } }
      ]
    })
    .toArray();

  return assignments.filter(assignment =>
    isAssignmentActive(assignment, now)
  );
}

// ======================================================
// OBTENER PERMISOS EFECTIVOS
// ======================================================

async function getEffectivePermissions(db, userId) {
  const id = toObjectId(userId);

  const assignments = await getUserAssignments(db, id);

  if (assignments.length === 0) {
    return [];
  }

  // Obtener identificadores válidos de roles.

  const roleIds = [
    ...new Map(
      assignments
        .filter(assignment =>
          assignment.roleId instanceof ObjectId
        )
        .map(assignment => [
          assignment.roleId.toString(),
          assignment.roleId
        ])
    ).values()
  ];

  if (roleIds.length === 0) {
    return [];
  }

  // Consultar roles activos.

  const roles = await db.collection('roles')
    .find({
      _id: { $in: roleIds },
      active: { $ne: false }
    })
    .toArray();

  if (roles.length === 0) {
    return [];
  }

  const roleMap = new Map(
    roles.map(role => [role._id.toString(), role])
  );

  // Conservar solamente asignaciones con alcances
  // permitidos para sus respectivos roles.

  const validAssignments = assignments.filter(assignment => {
    if (!(assignment.roleId instanceof ObjectId)) {
      return false;
    }

    const role = roleMap.get(assignment.roleId.toString());

    if (!role) {
      return false;
    }

    return isRoleScopeAllowed(role.key, assignment.scope);
  });

  if (validAssignments.length === 0) {
    return [];
  }

  const activeRoleIds = [
    ...new Map(
      validAssignments.map(assignment => [
        assignment.roleId.toString(),
        assignment.roleId
      ])
    ).values()
  ];

  // Consultar relaciones entre roles y permisos.

  const relations = await db.collection('role_permissions')
    .find({
      roleId: { $in: activeRoleIds }
    })
    .toArray();

  const validRelations = relations.filter(relation =>
    relation.roleId instanceof ObjectId &&
    relation.permissionId instanceof ObjectId
  );

  if (validRelations.length === 0) {
    return [];
  }

  // Obtener identificadores únicos de permisos.

  const permissionIds = [
    ...new Map(
      validRelations.map(relation => [
        relation.permissionId.toString(),
        relation.permissionId
      ])
    ).values()
  ];

  // Consultar permisos activos.

  const permissions = await db.collection('permissions')
    .find({
      _id: { $in: permissionIds },
      active: { $ne: false }
    })
    .toArray();

  const permissionMap = new Map(
    permissions.map(permission => [
      permission._id.toString(),
      permission
    ])
  );

  const effective = [];

  // Combinar permisos conservando cada asignación
  // y su alcance independiente.

  for (const assignment of validAssignments) {
    const role = roleMap.get(assignment.roleId.toString());

    if (!role) {
      continue;
    }

    for (const relation of validRelations) {
      if (
        relation.roleId.toString() !== role._id.toString()
      ) {
        continue;
      }

      const permission = permissionMap.get(
        relation.permissionId.toString()
      );

      if (
        !permission ||
        typeof permission.key !== 'string' ||
        typeof permission.module !== 'string'
      ) {
        continue;
      }

      effective.push({
        key: permission.key,
        module: permission.module,
        roleKey: role.key,
        scope: assignment.scope,
        assignmentId: assignment._id
      });
    }
  }

  return effective;
}

// ======================================================
// COMPROBAR PERMISOS
// ======================================================

async function hasPermission(
  db,
  userId,
  permissionKey,
  target = {}
) {
  if (
    typeof permissionKey !== 'string' ||
    !permissionKey.trim() ||
    !isValidTarget(target)
  ) {
    return false;
  }

  if (
    typeof target.module !== 'string' ||
    !target.module.trim()
  ) {
    return false;
  }

  const id = toObjectId(userId);

  // Comprobar estado actual del usuario.

  const user = await db.collection('users').findOne(
    { _id: id },
    {
      projection: {
        status: 1
      }
    }
  );

  if (!user || user.status !== 'active') {
    return false;
  }

  const permissions = await getEffectivePermissions(db, id);

  return permissions.some(permission => {
    // Coincidencia de permiso.

    if (permission.key !== permissionKey) {
      return false;
    }

    // Coincidencia de módulo.

    if (permission.module !== target.module) {
      return false;
    }

    // Verificar el alcance individual.

    return scopeAllows(permission.scope, target);
  });
}

// ======================================================
// MIDDLEWARE RBAC
// ======================================================

function requirePermission(
  permissionKey,
  getTarget = () => ({})
) {
  if (
    typeof permissionKey !== 'string' ||
    !permissionKey.trim() ||
    typeof getTarget !== 'function'
  ) {
    throw new Error('Configuración de permiso inválida.');
  }

  return async function permissionMiddleware(req, res, next) {
    try {
      const userId =
        req.authUser?.id ||
        req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Autenticación requerida.'
        });
      }

      const target = getTarget(req);

      if (!isValidTarget(target)) {
        return res.status(403).json({
          success: false,
          error: 'Destino de autorización inválido.'
        });
      }

      const allowed = await hasPermission(
        getDB(),
        userId,
        permissionKey,
        target
      );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permiso para realizar esta operación.'
        });
      }

      return next();

    } catch (error) {
      return next(error);
    }
  };
}

// ======================================================
// EXPORTACIONES
// ======================================================

module.exports = {
  ROLE_ALLOWED_SCOPES,
  toObjectId,
  isAssignmentActive,
  isValidScope,
  isRoleScopeAllowed,
  isValidTarget,
  getUserAssignments,
  getEffectivePermissions,
  hasPermission,
  requirePermission,
  scopeAllows
};
