
'use strict';

const { ObjectId } = require('mongodb');

function createUsersRepository(db) {
  const collection = db.collection('users');

  function parseId(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Identificador de usuario inválido.');
    }

    return new ObjectId(id);
  }

  const publicProjection = {
    passwordHash: 0
  };

  return {
    async findById(id, options = {}) {
      return collection.findOne(
        { _id: parseId(id) },
        {
          projection: publicProjection,
          session: options.session
        }
      );
    },

    async findByEmail(email, options = {}) {
      if (typeof email !== 'string' || !email.trim()) {
        throw new Error('Correo electrónico inválido.');
      }

      return collection.findOne(
        { email: email.trim().toLowerCase() },
        {
          projection: publicProjection,
          session: options.session
        }
      );
    },

    async list({ skip = 0, limit = 50, status, session } = {}) {
      const filter = {};

      if (status) {
        filter.status = status;
      }

      return collection.find(filter, {
        projection: publicProjection,
        session
      })
        .sort({ createdAt: -1 })
        .skip(Math.max(0, Number(skip) || 0))
        .limit(Math.min(100, Math.max(1, Number(limit) || 50)))
        .toArray();
    },

    async count(filter = {}, options = {}) {
      return collection.countDocuments(filter, {
        session: options.session
      });
    },

    async updateProfile(id, changes, options = {}) {
      const result = await collection.updateOne(
        { _id: parseId(id) },
        {
          $set: {
            ...changes,
            updatedAt: new Date()
          }
        },
        {
          session: options.session
        }
      );

      return result.modifiedCount === 1;
    },

    async updateStatus(id, status, options = {}) {
      const result = await collection.updateOne(
        { _id: parseId(id) },
        {
          $set: {
            status,
            updatedAt: new Date()
          }
        },
        {
          session: options.session
        }
      );

      return result.matchedCount === 1;
    }
  };
}

module.exports = {
  createUsersRepository
};
