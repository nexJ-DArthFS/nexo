
'use strict';

const {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS
} = require('./catalog');

// ======================================================
// VALIDAR CATÁLOGO
// ======================================================

function validateCatalog() {
  if (!Array.isArray(ROLES) || !Array.isArray(PERMISSIONS)) {
    throw new Error('ROLES y PERMISSIONS deben ser arrays.');
  }

  if (
    !ROLE_PERMISSIONS ||
    typeof ROLE_PERMISSIONS !== 'object' ||
    Array.isArray(ROLE_PERMISSIONS)
  ) {
    throw new Error('ROLE_PERMISSIONS debe ser un objeto válido.');
  }

  const roleKeys = new Set(ROLES.map(role => role.key));
  const permissionKeys = new Set(
    PERMISSIONS.map(permission => permission.key)
  );

  if (roleKeys.size !== ROLES.length) {
    throw new Error('El catálogo contiene roles duplicados.');
  }

  if (permissionKeys.size !== PERMISSIONS.length) {
    throw new Error('El catálogo contiene permisos duplicados.');
  }

  for (const role of ROLES) {
    if (
      !role ||
      typeof role.key !== 'string' ||
      !role.key.trim() ||
      typeof role.name !== 'string' ||
      !role.name.trim()
    ) {
      throw new Error('Todos los roles deben tener key y name válidos.');
    }

    if (!Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role.key)) {
      throw new Error(
        `El rol ${role.key} no tiene asignaciones definidas.`
      );
    }
  }

  for (const permission of PERMISSIONS) {
    if (
      !permission ||
      typeof permission.key !== 'string' ||
      !permission.key.trim() ||
      typeof permission.name !== 'string' ||
      !permission.name.trim() ||
      typeof permission.module !== 'string' ||
      !permission.module.trim()
    ) {
      throw new Error(
        'Todos los permisos deben tener key, name y module válidos.'
      );
    }
  }

  for (const roleKey of Object.keys(ROLE_PERMISSIONS)) {
    if (!roleKeys.has(roleKey)) {
      throw new Error(`Rol no definido en ROLES: ${roleKey}`);
    }

    const assignedPermissions = ROLE_PERMISSIONS[roleKey];

    if (!Array.isArray(assignedPermissions)) {
      throw new Error(
        `Los permisos del rol ${roleKey} deben ser un array.`
      );
    }

    if (new Set(assignedPermissions).size !== assignedPermissions.length) {
      throw new Error(
        `El rol ${roleKey} contiene permisos duplicados.`
      );
    }

    for (const permissionKey of assignedPermissions) {
      if (!permissionKeys.has(permissionKey)) {
        throw new Error(
          `Permiso no definido en PERMISSIONS: ${permissionKey}`
        );
      }
    }
  }
}

// ======================================================
// SINCRONIZAR CATÁLOGO
// ======================================================

async function synchronizeCatalog(db, session) {
  const rolesCollection = db.collection('roles');
  const permissionsCollection = db.collection('permissions');
  const relationsCollection = db.collection('role_permissions');

  const options = session ? { session } : {};
  const now = new Date();

  // ====================================================
  // 1. CREAR O ACTUALIZAR ROLES
  // ====================================================

  for (const role of ROLES) {
    await rolesCollection.updateOne(
      { key: role.key },
      {
        $set: {
          name: role.name,
          description: role.description,
          protected: role.protected === true,
          active: role.active !== false,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      {
        ...options,
        upsert: true
      }
    );
  }

  // ====================================================
  // 2. CREAR O ACTUALIZAR PERMISOS
  // ====================================================

  for (const permission of PERMISSIONS) {
    await permissionsCollection.updateOne(
      { key: permission.key },
      {
        $set: {
          name: permission.name,
          module: permission.module,
          description: permission.description,
          active: permission.active !== false,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      {
        ...options,
        upsert: true
      }
    );
  }

  // ====================================================
  // 3. RECUPERAR ROLES Y PERMISOS
  // ====================================================

  const roles = await rolesCollection.find(
    { key: { $in: ROLES.map(role => role.key) } },
    options
  ).toArray();

  const permissions = await permissionsCollection.find(
    { key: { $in: PERMISSIONS.map(permission => permission.key) } },
    options
  ).toArray();

  const roleMap = new Map(
    roles.map(role => [role.key, role])
  );

  const permissionMap = new Map(
    permissions.map(permission => [permission.key, permission])
  );

  if (roleMap.size !== ROLES.length) {
    throw new Error(
      'No se pudieron recuperar todos los roles del catálogo.'
    );
  }

  if (permissionMap.size !== PERMISSIONS.length) {
    throw new Error(
      'No se pudieron recuperar todos los permisos del catálogo.'
    );
  }

  // ====================================================
  // 4. SINCRONIZAR RELACIONES
  // ====================================================

  let relationsCreated = 0;
  let relationsDeleted = 0;

  const expectedRoleIds = roles.map(role => role._id);

  for (const [roleKey, permissionKeys] of Object.entries(
    ROLE_PERMISSIONS
  )) {
    const role = roleMap.get(roleKey);

    if (!role) {
      throw new Error(`No se encontró el rol: ${roleKey}`);
    }

    const expectedPermissionIds = [];

    for (const permissionKey of permissionKeys) {
      const permission = permissionMap.get(permissionKey);

      if (!permission) {
        throw new Error(
          `No se encontró el permiso: ${permissionKey}`
        );
      }

      expectedPermissionIds.push(permission._id);

      const result = await relationsCollection.updateOne(
        {
          roleId: role._id,
          permissionId: permission._id
        },
        {
          $setOnInsert: {
            roleId: role._id,
            permissionId: permission._id,
            createdAt: now
          }
        },
        {
          ...options,
          upsert: true
        }
      );

      if (result.upsertedCount === 1) {
        relationsCreated++;
      }
    }

    // Eliminar relaciones que no estén en el catálogo.

    const deleteResult = await relationsCollection.deleteMany(
      {
        roleId: role._id,
        permissionId: {
          $nin: expectedPermissionIds
        }
      },
      options
    );

    relationsDeleted += deleteResult.deletedCount;
  }

  // Eliminar relaciones de roles que ya no existen
  // en el catálogo autoritativo.

  const staleRolesResult = await relationsCollection.deleteMany(
    {
      roleId: {
        $nin: expectedRoleIds
      }
    },
    options
  );

  relationsDeleted += staleRolesResult.deletedCount;

  // ====================================================
  // 5. RESULTADO
  // ====================================================

  return {
    roles: ROLES.length,
    permissions: PERMISSIONS.length,
    relationsCreated,
    relationsDeleted,
    rolesSynchronized: Object.keys(ROLE_PERMISSIONS).length
  };
}

// ======================================================
// EJECUTAR SEED CON TRANSACCIÓN
// ======================================================

async function seedAccessCatalog(db, externalSession = null) {
  if (!db || typeof db.collection !== 'function') {
    throw new Error(
      'Se requiere una conexión válida a MongoDB.'
    );
  }

  validateCatalog();

  // Una sesión externa pertenece al proceso que la creó.
  // Este método no confirma ni cierra esa sesión.

  if (externalSession) {
    return synchronizeCatalog(db, externalSession);
  }

  const client = db.client;

  if (!client || typeof client.startSession !== 'function') {
    throw new Error(
      'No se pudo obtener el cliente MongoDB para iniciar la transacción.'
    );
  }

  const session = client.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await synchronizeCatalog(db, session);
    });

    return result;
  } finally {
    await session.endSession();
  }
}

// ======================================================
// EXPORTACIONES
// ======================================================

module.exports = {
  seedAccessCatalog,
  validateCatalog
};
