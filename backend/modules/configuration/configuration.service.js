
'use strict';

const ALLOWED_SETTINGS = {
  general: [
    'systemName',
    'systemDescription',
    'maintenanceMode'
  ],
  preferences: [
    'defaultLanguage',
    'defaultTimezone'
  ]
};

const DEFAULT_SETTINGS = {
  general: {
    systemName: 'NEXORA',
    systemDescription: 'Intelligent Productivity Platform',
    maintenanceMode: false
  },
  preferences: {
    defaultLanguage: 'es',
    defaultTimezone: 'America/Guayaquil'
  }
};

function validateSettings(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('La configuración debe ser un objeto válido.');
  }

  for (const [section, values] of Object.entries(input)) {
    if (!Object.prototype.hasOwnProperty.call(ALLOWED_SETTINGS, section)) {
      throw new Error(`Sección no permitida: ${section}`);
    }

    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      throw new Error(`La sección ${section} debe ser un objeto.`);
    }

    for (const [key, value] of Object.entries(values)) {
      if (!ALLOWED_SETTINGS[section].includes(key)) {
        throw new Error(`Parámetro no permitido: ${key}`);
      }

      if (key === 'maintenanceMode' && typeof value !== 'boolean') {
        throw new Error('maintenanceMode debe ser booleano.');
      }

      if (
        ['systemName', 'systemDescription', 'defaultLanguage', 'defaultTimezone'].includes(key) &&
        (typeof value !== 'string' || !value.trim())
      ) {
        throw new Error(`${key} debe ser un texto válido.`);
      }

      if (typeof value === 'string' && value.length > 200) {
        throw new Error(`${key} supera el límite de caracteres.`);
      }
    }
  }

  return true;
}

function createConfigurationService(db) {
  const collection = db.collection('system_settings');

  async function initialize() {
    const now = new Date();

    for (const [section, values] of Object.entries(DEFAULT_SETTINGS)) {
      for (const [key, value] of Object.entries(values)) {
        await collection.updateOne(
          { section, key },
          {
            $setOnInsert: {
              section,
              key,
              value,
              createdAt: now,
              updatedAt: now
            }
          },
          { upsert: true }
        );
      }
    }
  }

  async function getAll() {
    await initialize();

    const documents = await collection
      .find({}, { projection: { _id: 0, section: 1, key: 1, value: 1 } })
      .toArray();

    const settings = {};

    for (const document of documents) {
      if (!settings[document.section]) {
        settings[document.section] = {};
      }

      settings[document.section][document.key] = document.value;
    }

    return settings;
  }

  async function update(input) {
    validateSettings(input);

    await initialize();

    const now = new Date();

    for (const [section, values] of Object.entries(input)) {
      for (const [key, value] of Object.entries(values)) {
        await collection.updateOne(
          { section, key },
          {
            $set: {
              value,
              updatedAt: now
            }
          }
        );
      }
    }

    return getAll();
  }

  return {
    getAll,
    update
  };
}

module.exports = {
  createConfigurationService,
  validateSettings
};
