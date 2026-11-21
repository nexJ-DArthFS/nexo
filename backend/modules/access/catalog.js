
'use strict';

// ==========================================
// ROLES DEL SISTEMA
// ==========================================

const ROLES = [
  {
    key: 'super_admin',
    name: 'Superadministrador',
    description: 'Control global del sistema.',
    protected: true,
    active: true
  },
  {
    key: 'admin',
    name: 'Administrador',
    description: 'Administración general autorizada.',
    protected: true,
    active: true
  },
  {
    key: 'module_manager',
    name: 'Gestor de módulo',
    description: 'Gestión de un módulo específico.',
    protected: false,
    active: true
  },
  {
    key: 'moderator',
    name: 'Moderador',
    description: 'Moderación de recursos autorizados.',
    protected: false,
    active: true
  },
  {
    key: 'user',
    name: 'Usuario',
    description: 'Acceso a las funciones personales.',
    protected: false,
    active: true
  }
];

// ==========================================
// PERMISOS DEL SISTEMA
// ==========================================

const PERMISSIONS = [
  // USUARIOS
  {
    key: 'users.read',
    name: 'Consultar usuarios',
    module: 'users',
    description: 'Consultar información de usuarios.'
  },
  {
    key: 'users.update',
    name: 'Actualizar usuarios',
    module: 'users',
    description: 'Modificar información de usuarios.'
  },
  {
    key: 'users.manage_status',
    name: 'Gestionar estados',
    module: 'users',
    description: 'Suspender o reactivar cuentas.'
  },

  // ACCESOS
  {
    key: 'access.read',
    name: 'Consultar accesos',
    module: 'access',
    description: 'Consultar roles y permisos.'
  },
  {
    key: 'access.manage_roles',
    name: 'Gestionar roles',
    module: 'access',
    description: 'Administrar asignaciones de roles.'
  },
  {
    key: 'access.manage_permissions',
    name: 'Gestionar permisos',
    module: 'access',
    description: 'Administrar permisos del sistema.'
  },

  // AUDITORÍA
  {
    key: 'audit.read',
    name: 'Consultar auditoría',
    module: 'audit',
    description: 'Consultar registros de auditoría.'
  },

  // NOTAS
  {
    key: 'notes.create',
    name: 'Crear notas',
    module: 'notes',
    description: 'Crear notas personales.'
  },
  {
    key: 'notes.read',
    name: 'Consultar notas',
    module: 'notes',
    description: 'Consultar notas autorizadas.'
  },
  {
    key: 'notes.update',
    name: 'Actualizar notas',
    module: 'notes',
    description: 'Modificar notas autorizadas.'
  },
  {
    key: 'notes.delete',
    name: 'Eliminar notas',
    module: 'notes',
    description: 'Eliminar notas autorizadas.'
  },
  {
    key: 'notes.manage',
    name: 'Gestionar notas',
    module: 'notes',
    description: 'Administrar notas dentro del módulo autorizado.'
  },

  // TAREAS
  {
    key: 'tasks.create',
    name: 'Crear tareas',
    module: 'tasks',
    description: 'Crear tareas personales.'
  },
  {
    key: 'tasks.read',
    name: 'Consultar tareas',
    module: 'tasks',
    description: 'Consultar tareas autorizadas.'
  },
  {
    key: 'tasks.update',
    name: 'Actualizar tareas',
    module: 'tasks',
    description: 'Modificar tareas autorizadas.'
  },
  {
    key: 'tasks.delete',
    name: 'Eliminar tareas',
    module: 'tasks',
    description: 'Eliminar tareas autorizadas.'
  },
  {
    key: 'tasks.manage',
    name: 'Gestionar tareas',
    module: 'tasks',
    description: 'Administrar tareas dentro del módulo autorizado.'
  }
];

// ==========================================
// RELACIONES INICIALES ENTRE ROLES Y PERMISOS
// ==========================================

const ROLE_PERMISSIONS = {
  // Control global.
  super_admin: PERMISSIONS.map(permission => permission.key),

  // Administración global restringida.
  admin: [
    'users.read',
    'users.update',
    'users.manage_status',
    'access.read',
    'audit.read'
  ],

  // Gestión de módulos asignados.
  module_manager: [
    'notes.read',
    'notes.update',
    'notes.manage',
    'tasks.read',
    'tasks.update',
    'tasks.manage'
  ],

  // Moderación de recursos asignados.
  moderator: [
    'notes.read',
    'notes.update',
    'tasks.read',
    'tasks.update'
  ],

  // Funciones personales.
  user: [
    'notes.create',
    'notes.read',
    'notes.update',
    'notes.delete',
    'tasks.create',
    'tasks.read',
    'tasks.update',
    'tasks.delete'
  ]
};

// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS
};
