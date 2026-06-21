# Archivo: `database/README.md`

# Base de datos — NEXORA

## Propósito

Esta carpeta contendrá la estructura, modelos, scripts y documentación relacionados con la base de datos de NEXORA.

La base de datos permitirá guardar de forma organizada la información necesaria para que el sistema funcione: usuarios, tareas, notas y, en futuras versiones, categorías, recordatorios, hábitos u otros módulos.

---

## Información que gestionará inicialmente

La primera versión del sistema deberá manejar principalmente:

* Usuarios, cuando se implemente autenticación.
* Tareas.
* Notas.

Durante el prototipo inicial se podrán usar datos de prueba o almacenamiento temporal mientras se define la base de datos definitiva.

---

## Modelo inicial de datos

```text
Usuario
 ├── id
 ├── nombre
 ├── correo
 ├── contraseña_cifrada
 ├── fecha_creacion
 └── fecha_actualizacion

Tarea
 ├── id
 ├── usuario_id
 ├── titulo
 ├── descripcion
 ├── prioridad
 ├── estado
 ├── fecha_limite
 ├── fecha_creacion
 └── fecha_actualizacion

Nota
 ├── id
 ├── usuario_id
 ├── titulo
 ├── contenido
 ├── fecha_creacion
 └── fecha_actualizacion
```

---

## Relaciones iniciales

```text
Usuario
   │
   ├── puede tener muchas tareas
   │
   └── puede tener muchas notas
```

Expresado de otra forma:

```text
Un usuario → muchas tareas
Un usuario → muchas notas
Cada tarea → pertenece a un usuario
Cada nota → pertenece a un usuario
```

---

## Reglas de los datos

### Tareas

* El título será obligatorio.
* La descripción será opcional.
* La prioridad podrá ser alta, media o baja.
* El estado inicial será pendiente.
* La fecha límite será opcional.
* Una tarea completada conservará su registro para que el usuario pueda consultarla.

### Notas

* El título será obligatorio.
* El contenido será obligatorio.
* Cada nota deberá registrar fecha de creación.
* Cada modificación deberá actualizar la fecha de última modificación.

### Usuarios

* El correo deberá ser único.
* Las contraseñas no deberán guardarse en texto plano.
* Cada usuario solo podrá acceder a sus propios datos.

---

## Archivos futuros esperados

```text
database/
│
├── schema/
│   └── estructura de tablas o colecciones
│
├── migrations/
│   └── cambios controlados en la base de datos
│
├── seeds/
│   └── datos de prueba
│
├── queries/
│   └── consultas importantes
│
└── README.md
```

---

## Seguridad y privacidad

La base de datos deberá respetar estas reglas:

* No guardar contraseñas sin cifrado o hash seguro.
* No subir bases de datos reales de usuarios a GitHub.
* Usar datos ficticios en pruebas y demostraciones.
* Mantener credenciales de conexión fuera del repositorio.
* Guardar claves de conexión únicamente en variables de entorno.
* Definir permisos adecuados cuando exista más de un usuario.
* Planificar copias de seguridad antes de usar datos reales.

---

## Tecnología prevista

La tecnología de base de datos aún está por definirse.

La decisión dependerá de:

* La facilidad de integración con el backend.
* La seguridad.
* La escalabilidad.
* El costo.
* La facilidad de aprendizaje durante el desarrollo del MVP.

La decisión final deberá registrarse en:

```text
docs/decisiones-tecnicas.md
```

---

## Estado actual

**Fase:** Diseño inicial del modelo de datos.

**Siguiente paso:**

> Revisar el modelo inicial de Usuario, Tarea y Nota antes de elegir la tecnología de base de datos.

