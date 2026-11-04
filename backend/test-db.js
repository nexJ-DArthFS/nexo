require("dotenv").config();

const { MongoClient } = require("mongodb");

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("No se encontró MONGODB_URI en el archivo .env");
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();

    const result = await client.db("admin").command({ ping: 1 });

    if (result.ok !== 1) {
      throw new Error("MongoDB no respondió correctamente al ping");
    }

    console.log("Conexión con MongoDB Atlas exitosa.");
    console.log("La base de datos respondió correctamente.");
  } finally {
    await client.close();
  }
}

testConnection().catch((error) => {
  console.error("No se pudo conectar con MongoDB Atlas.");
  console.error(error.message);
  process.exitCode = 1;
});