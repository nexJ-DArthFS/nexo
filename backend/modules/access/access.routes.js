'use strict';
const {
  createAccessManagementService
} = require('./access-management.service');

const express = require('express');
const { ObjectId } = require('mongodb');

const { getDB } = require('../../config/db');
const requireAuth = require('../../middleware/requireAuth');

const {
  requirePermission,
  isAssignmentActive,
  isRoleScopeAllowed
} = require('./access.service');

const router = express.Router();
function getManagementService() {
  return createAccessManagementService(getDB());
}
router.use(requireAuth);

const accessScope = () => ({
  module: 'access'
});

// ==========================================
// CONSULTAR CATÁLOGO DE ROLES Y PERMISOS
// GET /api/access/catalog
// ==========================================

router.get(
  '/catalog',
  requirePermission('access.read', accessScope),
  async (req, res, next) => {
    try {
      const db = getDB();

      const [roles, permissions, relations] = await Promise.all([
        db.collection('roles')
          .find({})
          .sort({ key: 1 })
          .toArray(),

        db.collection('permissions')
          .find({})
          .sort({ module: 1, key: 1 })
          .toArray(),

        db.collection('role_permissions')
          .find({})
          .toArray()
      ]);

      const rolePermissions = relations.map(relation => ({
        roleId: relation.roleId.toString(),
        permissionId: relation.permissionId.toString()
      }));

      return res.json({
        success: true,
        roles,
        permissions,
        rolePermissions
      });

    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// CONSULTAR ASIGNACIONES DE UN USUARIO
// GET /api/access/users/:id/assignments
// ==========================================

router.get(
  '/users/:id/assignments',
  requirePermission('access.read', accessScope),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id) || id.length !== 24) {
        return res.status(400).json({
          success: false,
          error: 'Identificador de usuario inválido.'
        });
      }

      const db = getDB();
      const userId = new ObjectId(id);

      const user = await db.collection('users').findOne(
        { _id: userId },
        {
          projection: {
            passwordHash: 0
          }
        }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado.'
        });
      }

      const assignments = await db.collection('role_assignments')
        .find({ userId })
        .sort({ assignedAt: -1, createdAt: -1 })
        .toArray();

      const roleIds = [
        ...new Map(
          assignments
            .filter(item => item.roleId instanceof ObjectId)
            .map(item => [
              item.roleId.toString(),
              item.roleId
            ])
        ).values()
      ];

      const roles = roleIds.length
        ? await db.collection('roles')
            .find({ _id: { $in: roleIds } })
            .toArray()
        : [];

      const roleMap = new Map(
        roles.map(role => [
          role._id.toString(),
          role
        ])
      );

      const now = new Date();

      const result = assignments.map(assignment => {
        const role = roleMap.get(
          assignment.roleId?.toString()
        );

        const assignmentActive = isAssignmentActive(
          assignment,
          now
        );

        const scopeAllowed = role
          ? isRoleScopeAllowed(
              role.key,
              assignment.scope
            )
          : false;

        const effective =
          user.status === 'active' &&
          assignmentActive &&
          Boolean(role) &&
          role.active !== false &&
          scopeAllowed;

        return {
          ...assignment,

          id: assignment._id.toString(),

          role: role
            ? {
                id: role._id.toString(),
                key: role.key,
                name: role.name,
                protected: role.protected,
                active: role.active !== false
              }
            : null,

          assignedAt:
            assignment.assignedAt ||
            assignment.createdAt ||
            null,

          expired:
            assignment.expiresAt != null &&
            new Date(assignment.expiresAt) <= now,

          scopeAllowed,
          effective
        };
      });

      return res.json({
        success: true,

        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          status: user.status
        },

        assignments: result
      });

    } catch (error) {
      next(error);
    }
  }
);


// ==========================================
// ACL-04: ASIGNAR UN ROL
// POST /api/access/assignments
// ==========================================

router.post(
  '/assignments',
  requirePermission('access.manage_roles', accessScope),
  async (req, res, next) => {
    try {
      const result = await getManagementService().assignRole(
        req.body,
        req.authUser.id,
        req
      );

      return res.status(201).json({
        success: true,
        message: 'Rol asignado correctamente.',
        ...result
      });
    } catch (error) {
      return next(error);
    }
  }
);

// ==========================================
// ACL-04: MODIFICAR UNA ASIGNACIÓN
// PATCH /api/access/assignments/:assignmentId
// ==========================================

router.patch(
  '/assignments/:assignmentId',
  requirePermission('access.manage_roles', accessScope),
  async (req, res, next) => {
    try {
      const assignment = await getManagementService().updateAssignment(
        req.params.assignmentId,
        req.body,
        req.authUser.id,
        req
      );

      return res.json({
        success: true,
        message: 'Asignación actualizada correctamente.',
        assignment
      });
    } catch (error) {
      return next(error);
    }
  }
);

// ==========================================
// ACL-04: REVOCAR UNA ASIGNACIÓN
// DELETE /api/access/assignments/:assignmentId
// ==========================================

router.delete(
  '/assignments/:assignmentId',
  requirePermission('access.manage_roles', accessScope),
  async (req, res, next) => {
    try {
      const assignment = await getManagementService().revokeAssignment(
        req.params.assignmentId,
        req.authUser.id,
        req
      );

      return res.json({
        success: true,
        message: 'Asignación revocada correctamente.',
        assignment
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
