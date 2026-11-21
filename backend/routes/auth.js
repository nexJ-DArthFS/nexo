
'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

const { getDB } = require('../config/db');
const {
  getEffectivePermissions
} = require('../modules/access/access.service');

const router = express.Router();

// ======================================================
// 1. FUNCIONES AUXILIARES
// ======================================================

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email
  };
}

function regenerateSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate(error => {
      if (error) return reject(error);

      req.session.user = publicUser(user);

      req.session.save(saveError => {
        if (saveError) return reject(saveError);
        resolve();
      });
    });
  });
}

function destroySession(req, res, callback) {
  req.session.destroy(error => {
    res.clearCookie('nexora.sid', {
      path: '/'
    });

    callback(error);
  });
}

// ======================================================
// 2. REGISTRO
// ======================================================

router.post('/register', async (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string'
      ? req.body.name.trim()
      : '';

    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';

    const password = typeof req.body?.password === 'string'
      ? req.body.password
      : '';

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({
        error: 'El nombre debe tener entre 2 y 80 caracteres.'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Correo electrónico inválido.'
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.'
      });
    }

    const db = getDB();

    const users = db.collection('users');
    const roles = db.collection('roles');
    const assignments = db.collection('role_assignments');
    const auditLogs = db.collection('audit_logs');

    const existing = await users.findOne(
      { email },
      { projection: { _id: 1 } }
    );

    if (existing) {
      return res.status(409).json({
        error: 'Este correo ya está registrado.'
      });
    }

    const userRole = await roles.findOne({
      key: 'user',
      active: { $ne: false }
    });

    if (!userRole) {
      return res.status(503).json({
        error: 'El sistema de acceso todavía no está inicializado.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const session = db.client.startSession();

    let createdUser;

    try {
      await session.withTransaction(async () => {
        const now = new Date();

        const currentUser = await users.findOne(
          { email },
          {
            projection: { _id: 1 },
            session
          }
        );

        if (currentUser) {
          const error = new Error(
            'Este correo ya está registrado.'
          );
          error.status = 409;
          throw error;
        }

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

        const userId = userResult.insertedId;

        createdUser = {
          _id: userId,
          name,
          email
        };

        await assignments.insertOne(
          {
            userId,
            roleId: userRole._id,
            scope: {
              type: 'global',
              module: null,
              resourceType: null,
              resourceId: null
            },
            assignedBy: userId,
            assignedAt: now,
            expiresAt: null,
            active: true,
            source: 'registration'
          },
          { session }
        );

        await auditLogs.insertOne(
          {
            actorId: userId,
            action: 'auth.register',
            target: {
              type: 'user',
              id: userId
            },
            details: {
              roleKey: 'user'
            },
            result: 'success',
            createdAt: now
          },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    await regenerateSession(req, createdUser);

    return res.status(201).json({
      success: true,
      user: publicUser(createdUser)
    });

  } catch (error) {
    if (error.code === 11000 || error.status === 409) {
      return res.status(409).json({
        error: 'Este correo ya está registrado.'
      });
    }

    return next(error);
  }
});

// ======================================================
// 3. INICIO DE SESIÓN
// ======================================================

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';

    const password = typeof req.body?.password === 'string'
      ? req.body.password
      : '';

    if (!email || !password) {
      return res.status(400).json({
        error: 'Introduce tu correo y contraseña.'
      });
    }

    const user = await getDB()
      .collection('users')
      .findOne({ email });

    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos.'
      });
    }

    if (user.status !== 'active') {
      const messages = {
        pending: 'Tu cuenta está pendiente de activación.',
        suspended: 'Tu cuenta está suspendida.',
        disabled: 'Tu cuenta está deshabilitada.'
      };

      return res.status(403).json({
        error: messages[user.status] || 'Tu cuenta no está habilitada.'
      });
    }

    await regenerateSession(req, user);

    return res.json({
      success: true,
      user: publicUser(user)
    });

  } catch (error) {
    return next(error);
  }
});

// ======================================================
// 4. CONSULTAR SESIÓN Y PERMISOS
// ======================================================

router.get('/me', async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(401).json({
        authenticated: false
      });
    }

    const db = getDB();

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          name: 1,
          email: 1,
          status: 1
        }
      }
    );

    if (!user || user.status !== 'active') {
      return destroySession(req, res, error => {
        if (error) return next(error);

        return res.status(401).json({
          authenticated: false
        });
      });
    }

    const permissions = await getEffectivePermissions(
      db,
      user._id
    );

    req.session.user = publicUser(user);

    return res.json({
      authenticated: true,
      user: req.session.user,
      permissions
    });

  } catch (error) {
    return next(error);
  }
});

// ======================================================
// 5. CERRAR SESIÓN
// ======================================================

router.post('/logout', (req, res, next) => {
  destroySession(req, res, error => {
    if (error) return next(error);

    return res.json({
      success: true
    });
  });
});

module.exports = router;
