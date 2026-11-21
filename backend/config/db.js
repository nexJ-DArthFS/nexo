'use strict';

const { MongoClient } = require('mongodb');

let client = null;
let connectionPromise = null;

function getMongoClient() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Falta MONGODB_URI en el archivo .env');
  }

  if (!client) {
    client = new MongoClient(uri);
  }

  return client;
}

async function connectDB() {
  const mongoClient = getMongoClient();

  if (!connectionPromise) {
    connectionPromise = mongoClient.connect().catch((error) => {
      connectionPromise = null;
      client = null;
      throw error;
    });
  }

  await connectionPromise;

  return mongoClient.db('nexora');
}

function getDB() {
  if (!connectionPromise) {
    throw new Error('MongoDB todavía no se ha conectado');
  }

  return getMongoClient().db('nexora');
}

async function closeDB() {
  if (!client) return;

  try {
    if (connectionPromise) {
      await connectionPromise;
    }
  } finally {
    await client.close();
    client = null;
    connectionPromise = null;
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB
};