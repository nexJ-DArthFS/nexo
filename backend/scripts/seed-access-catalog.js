'use strict';

require('dotenv').config();

const {
  connectDB,
  getDB,
  closeDB
} = require('../config/db');

const {
  seedAccessCatalog
} = require('../modules/access/seed');

async function main() {
  try {
    await connectDB();

    const db = getDB();

    const result = await seedAccessCatalog(db);

    console.log('\nCatálogo NEXORA inicializado correctamente.');
    console.log(`Roles: ${result.roles}`);
    console.log(`Permisos: ${result.permissions}`);

  } finally {
    await closeDB();
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exitCode = 1;
});