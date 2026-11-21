'use strict';

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

async function requireAuth(req, res, next) {
  try {
    const userId = req.session?.user?.id;

    // 1. Comprobar que exista una sesión.
    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        error: 'Autenticación requerida.'
      });
    }

    // 2. Consultar el usuario en MongoDB.
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

    // 3. Comprobar que exista y esté activo.
    if (!user || user.status !== 'active') {
      return req.session.destroy((error) => {
        res.clearCookie('nexora.sid', {
          path: '/'
        });

        if (error) {
          return next(error);
        }

        return res.status(401).json({
          success: false,
          error: 'La sesión no es válida o la cuenta no está activa.'
        });
      });
    }

    // 4. Actualizar la información autenticada.
    req.authUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      status: user.status
    };

    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    };

    return next();

  } catch (error) {
    return next(error);
  }
}

module.exports = requireAuth;