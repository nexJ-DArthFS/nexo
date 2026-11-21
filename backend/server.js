
'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;

const auditRoutes = require('./modules/audit/audit.routes');
const configurationRoutes = require('./modules/configuration/configuration.routes');

const {
  connectDB,
  getDB,
  closeDB
} = require('./config/db');

const modulesRoutes = require('./modules/modules.routes');
const usersRoutes = require('./modules/users/users.routes');
const accessRoutes = require('./modules/access/access.routes');

// ======================================================
// 1. CONFIGURACIÓN
// ======================================================

const app = express();

const PORT = Number(process.env.PORT) || 3001;
const HOST = '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.MONGODB_URI) {
  throw new Error('Falta MONGODB_URI en las variables de entorno.');
}

if (!process.env.SESSION_SECRET) {
  throw new Error('Falta SESSION_SECRET en las variables de entorno.');
}

if (process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET debe tener al menos 32 caracteres.');
}

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('El puerto configurado no es válido.');
}

// ======================================================
// 2. MIDDLEWARES
// ======================================================

if (isProduction) {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');
app.use(helmet());

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origen no autorizado por CORS.'));
  },
  credentials: true
}));

app.use(express.json({
  limit: '100kb'
}));

// ======================================================
// 3. SESIONES
// ======================================================

const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
  dbName: 'nexora',
  collectionName: 'sessions',
  autoRemove: 'native'
});

app.use(session({
  name: 'nexora.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/'
  }
}));

// ======================================================
// 4. RUTAS
// ======================================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', usersRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/configuration', configurationRoutes);

// ======================================================
// 5. CLASIFICADOR DE NOTAS
// ======================================================

const MAX_NOTE_LENGTH = 20000;

function normalizeForClassification(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[¿¡]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const rules = [
  {
    category: 'tasks',
    label: 'Tarea',
    patterns: [
      /\b(tengo que|debo|necesito|hay que|pendiente|por hacer|me falta|falta por|toca|hacer|terminar|entregar|enviar|revisar|estudiar|preparar|llamar|comprar|investigar|resolver|completar|organizar|asistir|presentar|escribir|contactar|hablar con)\b/i
    ]
  },
  {
    category: 'tasks',
    label: 'Tarea',
    patterns: [
      /\b(hoy|manana|pasado manana|esta tarde|esta noche|el lunes|el martes|el miercoles|el jueves|el viernes|el sabado|el domingo|la proxima semana|antes de|despues de)\b.{0,45}\b(hablar|llamar|enviar|entregar|revisar|estudiar|preparar|comprar|investigar|hacer|terminar|resolver|completar|presentar|escribir|contactar|asistir|organizar|reunirme|reunirse)\b/i,
      /\b(hablar|llamar|enviar|entregar|revisar|estudiar|preparar|comprar|investigar|hacer|terminar|resolver|completar|presentar|escribir|contactar|asistir|organizar)\b.{0,45}\b(hoy|manana|pasado manana|esta tarde|esta noche|el lunes|el martes|el miercoles|el jueves|el viernes|el sabado|el domingo|la proxima semana)\b/i
    ]
  },
  {
    category: 'objectives',
    label: 'Objetivo',
    patterns: [
      /\b(mi objetivo|objetivo|meta|quiero lograr|quiero alcanzar|me propongo|aspiracion|aspirar a)\b/i
    ]
  },
  {
    category: 'questions',
    label: 'Pregunta',
    patterns: [
      /\?/,
      /\b(me pregunto|no se si|como puedo|por que|que pasaria|averiguar si)\b/i
    ]
  },
  {
    category: 'decisions',
    label: 'Decisión',
    patterns: [
      /\b(decidi|he decidido|decision|elegi|elegir|optare|voy a escoger|acordamos|acuerdo)\b/i
    ]
  },
  {
    category: 'concerns',
    label: 'Preocupación',
    patterns: [
      /\b(me preocupa|preocupado|preocupada|estresado|estresada|agobiado|agobiada|me cuesta|tengo miedo|me siento|agotado|agotada|confundido|confundida)\b/i
    ]
  },
  {
    category: 'ideas',
    label: 'Idea',
    patterns: [
      /\b(idea|se me ocurre|podria|podemos|seria interesante|propongo|imagino|crear|disenar|inventar)\b/i
    ]
  },
  {
    category: 'knowledge',
    label: 'Conocimiento',
    patterns: [
      /\b(aprendi|descubri|entendi|comprendi|principio|concepto|teorema|definicion|significa|consiste en|observe)\b/i
    ]
  }
];

// ======================================================
// 6. FUNCIONES DE CLASIFICACIÓN
// ======================================================

function classifyFragment(text) {
  const normalized = normalizeForClassification(text);

  for (const rule of rules) {
    if (rule.patterns.some(pattern => pattern.test(normalized))) {
      return {
        category: rule.category,
        label: rule.label
      };
    }
  }

  return {
    category: 'review',
    label: 'Por revisar'
  };
}

function splitIntoFragments(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n+|(?<=[.!?])\s+/)
    .map(fragment => fragment.trim())
    .filter(Boolean);
}

// ======================================================
// 7. ESTADO DEL SERVIDOR
// ======================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'NEXORA API'
  });
});

// ======================================================
// 8. ANÁLISIS DE NOTAS - MOD-03
// ======================================================

app.post('/api/notes/analyze', async (req, res, next) => {
  try {
    const noteModule = await getDB()
      .collection('modules')
      .findOne({ key: 'noteanalysis' });

    if (!noteModule || noteModule.active !== true) {
      return res.status(403).json({
        success: false,
        error: 'El módulo de análisis de notas está desactivado.'
      });
    }

    const text = req.body?.text;

    if (typeof text !== 'string') {
      return res.status(400).json({
        error: 'El campo text debe ser una cadena de texto.'
      });
    }

    const normalizedText = text.trim();

    if (!normalizedText) {
      return res.status(400).json({
        error: 'Escribe una nota antes de analizarla.'
      });
    }

    if (normalizedText.length > MAX_NOTE_LENGTH) {
      return res.status(413).json({
        error: `La nota supera el límite de ${MAX_NOTE_LENGTH} caracteres.`
      });
    }

    const fragments = splitIntoFragments(normalizedText);

    const items = fragments.map((fragment, index) => {
      const classification = classifyFragment(fragment);

      return {
        id: index + 1,
        text: fragment,
        category: classification.category,
        label: classification.label
      };
    });

    const grouped = {
      tasks: [],
      objectives: [],
      questions: [],
      decisions: [],
      concerns: [],
      ideas: [],
      knowledge: [],
      review: []
    };

    for (const item of items) {
      grouped[item.category].push(item);
    }

    return res.json({
      success: true,
      totalFragments: items.length,
      items,
      grouped,
      notice:
        'Clasificación orientativa: revisa los resultados y corrige las categorías que no representen tu intención.',
      privacy:
        'Esta API no guarda las notas en una base de datos. El texto se procesa en memoria durante la solicitud.'
    });

  } catch (error) {
    next(error);
  }
});

// ======================================================
// 9. MANEJADOR GLOBAL DE ERRORES
// ======================================================

app.use((error, _req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      error: 'El cuerpo de la solicitud contiene JSON inválido.'
    });
  }

  if (error.message === 'Origen no autorizado por CORS.') {
    return res.status(403).json({
      error: 'Origen no autorizado.'
    });
  }

  console.error('ERROR EN NEXORA:', error);

  return res.status(error.status || 500).json({
    error: error.status
      ? error.message
      : 'Ocurrió un error interno al procesar la solicitud.'
  });
});

// ======================================================
// 10. ÍNDICES DE BASE DE DATOS
// ======================================================

async function createIndexes(db) {
  await db.collection('users').createIndex(
    { email: 1 },
    {
      unique: true,
      name: 'email_1'
    }
  );

  await db.collection('roles').createIndex(
    { key: 1 },
    {
      unique: true,
      name: 'key_1'
    }
  );

  await db.collection('permissions').createIndex(
    { key: 1 },
    {
      unique: true,
      name: 'key_1'
    }
  );

  await db.collection('role_permissions').createIndex(
    { roleId: 1, permissionId: 1 },
    {
      unique: true,
      name: 'role_permission_unique'
    }
  );

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

  await db.collection('audit_logs').createIndex(
    { actorId: 1, createdAt: -1 },
    {
      name: 'audit_actor_created'
    }
  );

  await db.collection('audit_logs').createIndex(
    {
      'target.type': 1,
      'target.id': 1,
      createdAt: -1
    },
    {
      name: 'audit_target_created'
    }
  );

  await db.collection('modules').createIndex(
    { key: 1 },
    {
      unique: true,
      name: 'module_key_unique'
    }
  );

  await db.collection('system_settings').createIndex(
    { section: 1, key: 1 },
    {
      unique: true,
      name: 'system_settings_section_key_unique'
    }
  );
}

// ======================================================
// 11. INICIALIZACIÓN
// ======================================================

let httpServer = null;
let shuttingDown = false;

async function startServer() {
  await connectDB();

  const db = getDB();

  await createIndexes(db);

  await db.collection('modules').updateOne(
    { key: 'noteanalysis' },
    {
      $setOnInsert: {
        name: 'NoteAnalysis',
        key: 'noteanalysis',
        description: 'Analiza y clasifica el contenido de la hoja en blanco.',
        location: 'blank_sheet',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, HOST);

    server.once('error', reject);

    server.once('listening', () => {
      httpServer = server;

      console.log('------------------------------------');
      console.log('NEXORA BACKEND INICIADO');
      console.log(`Servidor: http://${HOST}:${PORT}`);
      console.log(`Puerto asignado: ${PORT}`);
      console.log(`Estado: /api/health`);
      console.log('Autenticación: /api/auth');
      console.log('Usuarios: /api/users');
      console.log('Accesos: /api/access');
      console.log('Módulos: /api/modules');
      console.log('Auditoría: /api/audit');
      console.log('Configuración: /api/configuration');
      console.log('Análisis: /api/notes/analyze');
      console.log('------------------------------------');

      resolve(server);
    });
  });
}

// ======================================================
// 12. CIERRE ORDENADO
// ======================================================

async function shutdown(signal = 'shutdown') {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(`\nCerrando NEXORA (${signal})...`);

  try {
    if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close(error => {
          if (error) {
            return reject(error);
          }

          resolve();
        });
      });
    }

    await sessionStore.close();
    await closeDB();

    console.log('NEXORA se cerró correctamente.');

  } catch (error) {
    console.error('Error durante el cierre:', error.message);
    process.exitCode = 1;
  }
}

// ======================================================
// 13. EJECUCIÓN
// ======================================================

if (require.main === module) {
  startServer().catch(async error => {
    console.error('No se pudo iniciar NEXORA:', error.message);

    try {
      await sessionStore.close();
      await closeDB();
    } catch (closeError) {
      console.error('Error al cerrar conexiones:', closeError.message);
    }

    process.exitCode = 1;
  });

  process.once('SIGINT', () => {
    shutdown('SIGINT').then(() => {
      process.exit();
    });
  });

  process.once('SIGTERM', () => {
    shutdown('SIGTERM').then(() => {
      process.exit();
    });
  });
}

module.exports = {
  app,
  startServer,
  shutdown,
  createIndexes,
  classifyFragment,
  splitIntoFragments
};
