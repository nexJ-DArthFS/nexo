# Archivo: `backend/README.md`

# Backend — NEXORA

## Propósito

Esta carpeta contendrá la lógica interna de NEXORA. El backend será responsable de procesar las acciones del usuario, aplicar reglas del sistema, comunicarse con la base de datos y exponer una API para el frontend.

El usuario no interactuará directamente con esta parte, pero será necesaria para que las tareas, notas, cuentas y datos puedan guardarse de forma organizada y segura.

---

## Responsabilidades del backend

El backend deberá encargarse de:

* Recibir solicitudes desde el frontend.
* Crear, consultar, editar y eliminar tareas.
* Crear, consultar, editar y eliminar notas.
* Gestionar usuarios y autenticación en etapas posteriores.
* Validar datos antes de guardarlos.
* Comunicarse con la base de datos.
* Responder al frontend mediante una API.
* Proteger información sensible y evitar exponer claves o contraseñas.

---

## Módulos iniciales previstos

```text
backend/
│
├── usuarios/
├── tareas/
├── notas/
├── autenticacion/
├── base-de-datos/
└── api/
```

### 1. Módulo de tareas

Deberá permitir:

* Crear tareas.
* Consultar tareas.
* Editar tareas.
* Eliminar tareas.
* Cambiar el estado de una tarea.
* Organizar tareas por prioridad.

### 2. Módulo de notas

Deberá permitir:

* Crear notas.
* Consultar notas.
* Editar notas.
* Eliminar notas.

### 3. Módulo de autenticación

Será desarrollado después de validar las funciones básicas del MVP.

Su finalidad será:

* Registrar usuarios.
* Iniciar sesión.
* Proteger los datos de cada usuario.
* Evitar que un usuario consulte o modifique datos de otro usuario.

---

## API inicial esperada

La API es el puente entre el frontend y el backend.

```text
Frontend
   ↓ solicitud
API del backend
   ↓ procesamiento
Base de datos
   ↓ respuesta
Frontend
```

Ejemplos de rutas futuras:

```text
GET    /api/tareas
POST   /api/tareas
PUT    /api/tareas/:id
DELETE /api/tareas/:id

GET    /api/notas
POST   /api/notas
PUT    /api/notas/:id
DELETE /api/notas/:id
```

Estas rutas son una propuesta inicial y podrán modificarse cuando se defina la arquitectura real.

---

## Tecnología prevista

El backend podría desarrollarse con Python, debido a que permitirá una futura integración más directa con herramientas de inteligencia artificial y automatización.

La tecnología concreta, el framework y la estructura definitiva deberán decidirse y registrarse en:

```text
docs/decisiones-tecnicas.md
```

---

## Reglas de seguridad

* No guardar contraseñas en texto plano.
* No subir archivos `.env` a GitHub.
* No publicar claves API, tokens ni credenciales.
* Validar los datos antes de guardarlos.
* Usar datos de prueba durante el desarrollo inicial.
* Separar la configuración privada del código público.
* Aplicar autenticación antes de guardar información personal real.

---

## Organización futura sugerida

```text
backend/
│
├── app/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── schemas/
│   └── config/
│
├── tests/
│   └── pruebas del backend
│
├── requirements.txt
└── README.md
```

---

## Estado actual

**Fase:** Planificación inicial.

**Siguiente paso:**

> Definir la tecnología del backend y crear una primera API de prueba para gestionar tareas.
# Archivo: `backend/README.md`

# Backend — NEXORA

## Propósito

Esta carpeta contendrá la lógica interna de NEXORA. El backend será responsable de procesar las acciones del usuario, aplicar reglas del sistema, comunicarse con la base de datos y exponer una API para el frontend.

El usuario no interactuará directamente con esta parte, pero será necesaria para que las tareas, notas, cuentas y datos puedan guardarse de forma organizada y segura.

---

## Responsabilidades del backend

El backend deberá encargarse de:

* Recibir solicitudes desde el frontend.
* Crear, consultar, editar y eliminar tareas.
* Crear, consultar, editar y eliminar notas.
* Gestionar usuarios y autenticación en etapas posteriores.
* Validar datos antes de guardarlos.
* Comunicarse con la base de datos.
* Responder al frontend mediante una API.
* Proteger información sensible y evitar exponer claves o contraseñas.

---

## Módulos iniciales previstos

```text
backend/
│
├── usuarios/
├── tareas/
├── notas/
├── autenticacion/
├── base-de-datos/
└── api/
```

### 1. Módulo de tareas

Deberá permitir:

* Crear tareas.
* Consultar tareas.
* Editar tareas.
* Eliminar tareas.
* Cambiar el estado de una tarea.
* Organizar tareas por prioridad.

### 2. Módulo de notas

Deberá permitir:

* Crear notas.
* Consultar notas.
* Editar notas.
* Eliminar notas.

### 3. Módulo de autenticación

Será desarrollado después de validar las funciones básicas del MVP.

Su finalidad será:

* Registrar usuarios.
* Iniciar sesión.
* Proteger los datos de cada usuario.
* Evitar que un usuario consulte o modifique datos de otro usuario.

---

## API inicial esperada

La API es el puente entre el frontend y el backend.

```text
Frontend
   ↓ solicitud
API del backend
   ↓ procesamiento
Base de datos
   ↓ respuesta
Frontend
```

Ejemplos de rutas futuras:

```text
GET    /api/tareas
POST   /api/tareas
PUT    /api/tareas/:id
DELETE /api/tareas/:id

GET    /api/notas
POST   /api/notas
PUT    /api/notas/:id
DELETE /api/notas/:id
```

Estas rutas son una propuesta inicial y podrán modificarse cuando se defina la arquitectura real.

---

## Tecnología prevista

El backend podría desarrollarse con Python, debido a que permitirá una futura integración más directa con herramientas de inteligencia artificial y automatización.

La tecnología concreta, el framework y la estructura definitiva deberán decidirse y registrarse en:

```text
docs/decisiones-tecnicas.md
```

---

## Reglas de seguridad

* No guardar contraseñas en texto plano.
* No subir archivos `.env` a GitHub.
* No publicar claves API, tokens ni credenciales.
* Validar los datos antes de guardarlos.
* Usar datos de prueba durante el desarrollo inicial.
* Separar la configuración privada del código público.
* Aplicar autenticación antes de guardar información personal real.

---

## Organización futura sugerida

```text
backend/
│
├── app/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── schemas/
│   └── config/
│
├── tests/
│   └── pruebas del backend
│
├── requirements.txt
└── README.md
```

---

## Estado actual

**Fase:** Planificación inicial.

**Siguiente paso:**

> Definir la tecnología del backend y crear una primera API de prueba para gestionar tareas.

