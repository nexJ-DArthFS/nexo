
'use strict';

require('dotenv').config();

const bcrypt = require('bcryptjs');

const {
  connectDB,
  getDB,
  closeDB
} = require('../config/db');

const {
  seedAccessCatalog
} = require('../modules/access/seed');

// ======================================================
// VALIDACIÓN DE CREDENCIALES
// ======================================================

function validateCredentials() {
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL
    ?.trim()
    .toLowerCase();

  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!name || name.length < 2 || name.length > 80) {
    throw new Error(
      'Define BOOTSTRAP_ADMIN_NAME (entre 2 y 80 caracteres).'
    );
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(
      'Define un BOOTSTRAP_ADMIN_EMAIL válido.'
    );
  }

  if (
    !password ||
    password.length < 12 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw new Error(
      'BOOTSTRAP_ADMIN_PASSWORD debe tener al menos 12 caracteres y no superar 72 bytes.'
    );
  }

  return { name, email, password };
}

// ======================================================
// ÍNDICES
// ======================================================

async function createBootstrapIndexes(db) {
  // Evitar roles duplicados.

  await db.collection('roles').createIndex(
    { key: 1 },
    {
      name: 'key_1',
      unique: true
    }
  );

  // Evitar permisos duplicados.

  await db.collection('permissions').createIndex(
    { key: 1 },
    {
      name: 'key_1',
      unique: true
    }
  );

  // Evitar relaciones duplicadas entre roles y permisos.

  await db.collection('role_permissions').createIndex(
    { roleId: 1, permissionId: 1 },
    {
      name: 'role_permission_unique',
      unique: true
    }
  );

  // Facilitar consultas de asignaciones de usuarios.

  await db.collection('role_assignments').createIndex(
    { userId: 1, roleId: 1 },
    {
      name: 'user_role_assignment_lookup'
    }
  );

  await db.collection('role_assignments').createIndex(
    { roleId: 1, active: 1, expiresAt: 1 },
    {
      name: 'active_role_assignments_lookup'
    }
  );
}

// ======================================================
// INICIALIZACIÓN DEL SUPERADMINISTRADOR
// ======================================================

async function main() {
  let session;
  let connected = false;

  try {
    const { name, email, password } = validateCredentials();

    await connectDB();
    connected = true;

    const db = getDB();

    // Crear índices antes de sincronizar el catálogo.
    await createBootstrapIndexes(db);

    // Sincronizar roles, permisos y relaciones.
    await seedAccessCatalog(db);

    const users = db.collection('users');
    const roles = db.collection('roles');
    const assignments = db.collection('role_assignments');
    const auditLogs = db.collection('audit_logs');

    const role = await roles.findOne({
      key: 'super_admin',
      active: { $ne: false }
    });

    if (!role) {
      throw new Error(
        'No se encontró un rol super_admin activo.'
      );
    }

    // Preparar el hash antes de iniciar la transacción.
    const passwordHash = await bcrypt.hash(password, 12);

    session = db.client.startSession();

    let createdUserId;

    await session.withTransaction(async () => {
      const now = new Date();

      // Bloqueo lógico para serializar bootstraps concurrentes.
      const roleLock = await roles.updateOne(
        { _id: role._id },
        {
          $inc: { bootstrapVersion: 1 },
          $set: { bootstrapUpdatedAt: now }
        },
        { session }
      );

      if (roleLock.matchedCount !== 1) {
        throw new Error(
          'No se pudo asegurar el rol super_admin.'
        );
      }

      // Comprobar si ya existe una asignación vigente.
      const existingSuperAdmin = await assignments.findOne(
        {
          roleId: role._id,
          active: true,
          $or: [
            { expiresAt: null },
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: now } }
          ]
        },
        { session }
      );

      if (existingSuperAdmin) {
        throw new Error(
          'Ya existe un superadministrador activo. Bootstrap cancelado.'
        );
      }

      // No promover cuentas existentes.
      const existingUser = await users.findOne(
        { email },
        {
          projection: { _id: 1 },
          session
        }
      );

      if (existingUser) {
        throw new Error(
          'El correo ya pertenece a una cuenta. No se promoverá automáticamente.'
        );
      }

      // Crear usuario.
      const userResult = await users.insertOne(
        {
          name,
          email,
          passwordHash,
          status: 'active',
          createdAt: now,
          updatedAt: now
        },
        { session }
      );

      createdUserId = userResult.insertedId;

      // Asignar super_admin global.
      await assignments.insertOne(
        {
          userId: createdUserId,
          roleId: role._id,
          scope: {
            type: 'global',
            module: null,
            resourceType: null,
            resourceId: null
          },
          assignedBy: createdUserId,
          assignedAt: now,
          expiresAt: null,
          active: true,
          source: 'bootstrap'
        },
        { session }
      );

      // Registrar auditoría dentro de la transacción.
      await auditLogs.insertOne(
        {
          actorId: createdUserId,
          action: 'bootstrap.super_admin.created',
          target: {
            type: 'user',
            id: createdUserId
          },
          details: {
            roleKey: 'super_admin',
            scopeType: 'global'
          },
          result: 'success',
          createdAt: now
        },
        { session }
      );
    });

    process.stdout.write(
      '\nSuperadministrador creado correctamente.\n' +
      `Correo: ${email}\n` +
      'Alcance: global\n' +
      'La contraseña no se muestra ni se registra.\n\n'
    );

  } finally {
    if (session) {
      await session.endSession();
    }

    if (connected) {
      await closeDB();
    }
  }
}

// ======================================================
// EJECUCIÓN
// ======================================================

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(
      `Bootstrap cancelado: ${error.message}\n`
    );

    process.exitCode = 1;
  });
}

module.exports = {
  main,
  validateCredentials,
  createBootstrapIndexes
};
