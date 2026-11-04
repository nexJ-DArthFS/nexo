
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Falta MONGODB_URI en el archivo .env");
}

const client = new MongoClient(uri);
let connectionPromise;

async function connectDB() {
  if (!connectionPromise) {
    connectionPromise = client.connect().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
  return client.db("nexora");
}

function getDB() {
  if (!connectionPromise) {
    throw new Error("MongoDB todavía no se ha conectado");
  }

  return client.db("nexora");
}

module.exports = { connectDB, getDB };
