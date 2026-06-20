# Archivo: `frontend/README.md`

# Frontend — NEXORA

## Propósito

Esta carpeta contiene la interfaz visual de NEXORA: las pantallas, componentes, estilos e interacciones que utilizará el usuario desde el navegador.

El frontend será la parte visible de la aplicación web y deberá permitir al usuario gestionar tareas y notas de forma clara, rápida y adaptable a computadora y celular.

---

## Responsabilidades del frontend

El frontend deberá encargarse de:

* Mostrar el panel principal de NEXORA.
* Permitir crear, editar, completar y eliminar tareas.
* Permitir crear, editar y eliminar notas.
* Mostrar tareas según prioridad y estado.
* Presentar un resumen de tareas pendientes y completadas.
* Conectarse con el backend mediante una API cuando esa capa sea desarrollada.
* Adaptar la interfaz a pantallas de computadora y celular.

---

## Pantallas iniciales previstas

```text
frontend/
│
├── Inicio o dashboard
├── Gestión de tareas
├── Gestión de notas
├── Inicio de sesión
└── Registro de usuario
```

### 1. Dashboard

Deberá mostrar:

* Número de tareas pendientes.
* Número de tareas completadas.
* Tareas de prioridad alta.
* Tareas próximas a su fecha límite.
* Accesos rápidos para crear tareas y notas.

### 2. Gestión de tareas

Deberá permitir:

* Crear una tarea.
* Editar una tarea.
* Eliminar una tarea.
* Marcar una tarea como completada.
* Asignar prioridad alta, media o baja.
* Visualizar tareas pendientes y completadas.

### 3. Gestión de notas

Deberá permitir:

* Crear una nota.
* Editar una nota.
* Eliminar una nota.
* Consultar notas guardadas.

---

## Tecnologías iniciales

Durante la fase de aprendizaje y prototipo se prevé utilizar:

* HTML para la estructura.
* CSS para estilos y diseño adaptable.
* JavaScript para interacciones iniciales.

Posteriormente, se evaluará usar una tecnología de componentes para construir una aplicación web más escalable.

> La selección definitiva de tecnologías debe registrarse en `docs/decisiones-tecnicas.md`.

---

## Organización futura sugerida

```text
frontend/
│
├── public/
│   └── recursos públicos del sitio
│
├── src/
│   ├── components/
│   │   └── componentes reutilizables
│   │
│   ├── pages/
│   │   └── pantallas principales
│   │
│   ├── styles/
│   │   └── estilos globales y específicos
│   │
│   ├── services/
│   │   └── conexión con la API del backend
│   │
│   └── main/
│       └── punto de inicio de la aplicación
│
└── README.md
```

---

## Reglas de desarrollo

* Mantener nombres claros para archivos, variables y componentes.
* Diseñar primero las pantallas principales antes de agregar funciones complejas.
* Priorizar una interfaz simple para usuarios con nivel técnico básico.
* No incluir claves, contraseñas ni tokens dentro del código.
* Separar la lógica visual de la conexión con la base de datos.
* Probar la interfaz tanto en computadora como en celular.

---

## Estado actual

**Fase:** Planificación inicial.

**Siguiente paso:**

> Diseñar la estructura visual inicial del dashboard y definir las pantallas mínimas del MVP.
