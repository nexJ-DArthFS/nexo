# NEXORA

NEXORA es un sistema inteligente de organización personal orientado a centralizar tareas, notas e información importante en un solo espacio digital.

Su primera versión será una aplicación web enfocada en ayudar a estudiantes y usuarios con múltiples responsabilidades a organizar pendientes, establecer prioridades y consultar rápidamente su información principal.

---

## Problema que busca resolver

Muchas personas administran sus tareas, apuntes, recordatorios e ideas mediante aplicaciones separadas, notas físicas o mensajes dispersos. Esta fragmentación puede producir olvidos, pérdida de tiempo y dificultad para identificar las actividades prioritarias.

NEXORA busca crear una base centralizada, clara y escalable para organizar esa información.

---

## Objetivo del MVP

Desarrollar una aplicación web responsive que permita al usuario:

* Crear, editar y eliminar tareas.
* Marcar tareas como completadas.
* Asignar prioridad alta, media o baja.
* Crear, editar y eliminar notas.
* Visualizar un panel principal con tareas pendientes, completadas y prioritarias.
* Usar la aplicación desde computadora o celular mediante un navegador.

---

## Funciones futuras

Las siguientes funciones forman parte de la visión de NEXORA, pero no se desarrollarán en la primera versión:

* Asistente conversacional con inteligencia artificial.
* Organización inteligente y recomendaciones personalizadas.
* Control y comandos por voz.
* Automatización de aplicaciones externas.
* Integración con calendarios, correo electrónico y otros servicios.
* Sincronización entre dispositivos.
* Aplicación móvil nativa.
* Protección avanzada de información y criptografía.
* Mapa sin conexión y herramientas adicionales de productividad.

---

## Estructura del proyecto

```text
NEXORA/
├── .gitignore
├── LICENSE
├── README.md
│
├── assets/
│   └── Recursos visuales, iconos, logotipos, bocetos y capturas.
│
├── backend/
│   └── Lógica del servidor, API, autenticación e integración futura con IA.
│
├── database/
│   └── Modelo de datos, scripts, migraciones y datos de prueba.
│
├── docs/
│   └── Documentación funcional, técnica y de planificación.
│
├── frontend/
│   └── Interfaz web visible para el usuario.
│
└── ideas/
    └── Visión, problema, oportunidades, privacidad y propuestas futuras.
```

---

## Documentación principal

| Documento                                                            | Propósito                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------ |
| [`docs/requisitos-mvp.md`](docs/requisitos-mvp.md)                   | Define las funciones mínimas de la primera versión.    |
| [`docs/roadmap.md`](docs/roadmap.md)                                 | Organiza las fases y entregables del proyecto.         |
| [`docs/decisiones-tecnicas.md`](docs/decisiones-tecnicas.md)         | Registra decisiones tecnológicas y sus motivos.        |
| [`ideas/documento-maestro.md`](ideas/documento-maestro.md)           | Define la visión general de NEXORA.                    |
| [`ideas/problema-y-oportunidad.md`](ideas/problema-y-oportunidad.md) | Explica el problema que NEXORA busca resolver.         |
| [`ideas/seguridad-y-privacidad.md`](ideas/seguridad-y-privacidad.md) | Define principios iniciales de seguridad y privacidad. |

---

## Estado actual

**Fase actual:** Fundamentación y planificación del MVP.

Actualmente, el proyecto cuenta con:

* Estructura base del repositorio.
* Documentación inicial del problema y la visión.
* Requisitos funcionales del MVP.
* Roadmap inicial.
* Reglas básicas de seguridad, privacidad y control de versiones.

---

## Próximos pasos

1. Completar las decisiones técnicas iniciales.
2. Definir la arquitectura básica del sistema.
3. Diseñar las pantallas principales del frontend.
4. Crear un prototipo visual del dashboard.
5. Iniciar la estructura base de la aplicación web.

---

## Seguridad

NEXORA no debe almacenar ni publicar contraseñas, claves API, tokens, archivos `.env` ni datos reales de usuarios dentro del repositorio.

La carpeta `.vs/`, archivos de configuración local y credenciales privadas se mantienen fuera del control de versiones mediante `.gitignore`.

---

## Licencia

Este proyecto utiliza la licencia Apache License 2.0. Consulta el archivo [`LICENSE`](LICENSE) para más información.

