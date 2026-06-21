# Archivo: `docs/requisitos-mvp.md`

# Requisitos del MVP — NEXORA

## 1. Objetivo del MVP

El objetivo de la primera versión de NEXORA es:

> [Escribe qué debe lograr la versión inicial.]

Ejemplo:

> Crear una aplicación web básica que permita a un usuario organizar tareas y notas personales desde un panel centralizado.

---

## 2. Usuario del MVP

* **Usuario objetivo:** [Ejemplo: estudiante universitario.]
* **Dispositivo principal:** [Computadora / celular / ambos.]
* **Problema que resolverá:** [Problema concreto.]
* **Nivel técnico esperado:** [Básico / intermedio / avanzado.]

---

## 3. Funciones incluidas

| Código | Función                          | Prioridad | Estado    |
| ------ | -------------------------------- | --------- | --------- |
| RF-01  | [Crear tareas]                   | Alta      | Pendiente |
| RF-02  | [Editar tareas]                  | Alta      | Pendiente |
| RF-03  | [Eliminar tareas]                | Alta      | Pendiente |
| RF-04  | [Marcar tareas como completadas] | Alta      | Pendiente |
| RF-05  | [Crear notas]                    | Alta      | Pendiente |
| RF-06  | [Visualizar resumen principal]   | Media     | Pendiente |
| RF-07  | [Organizar tareas por prioridad] | Media     | Pendiente |

---

## 4. Requisitos funcionales

### RF-01 — Crear tareas

El sistema deberá permitir que el usuario cree una tarea.

**Datos mínimos:**

* Título.
* Descripción opcional.
* Prioridad.
* Fecha límite opcional.

**Criterio de aceptación:**

> Cuando el usuario guarde una tarea válida, esta debe aparecer en su lista de tareas.

---

### RF-02 — Editar tareas

El sistema deberá permitir que el usuario modifique una tarea existente.

**Criterio de aceptación:**

> Cuando el usuario guarde los cambios, la tarea debe mostrar la información actualizada.

---

### RF-03 — Eliminar tareas

El sistema deberá permitir que el usuario elimine una tarea.

**Criterio de aceptación:**

> Cuando el usuario confirme la eliminación, la tarea ya no debe aparecer en la lista.

---

### RF-04 — Completar tareas

El sistema deberá permitir que el usuario marque una tarea como completada.

**Criterio de aceptación:**

> Una tarea completada debe mostrar visualmente un estado diferente.

---

### RF-05 — Crear notas

El sistema deberá permitir que el usuario cree y guarde notas.

**Datos mínimos:**

* Título.
* Contenido.
* Fecha de creación.

**Criterio de aceptación:**

> Una nota guardada debe aparecer en la sección de notas.

---

## 5. Requisitos no funcionales

| Código | Requisito        | Criterio                                                                    |
| ------ | ---------------- | --------------------------------------------------------------------------- |
| RNF-01 | Interfaz clara   | El usuario debe entender las funciones principales sin capacitación.        |
| RNF-02 | Diseño adaptable | La interfaz debe poder visualizarse en computadora y celular.               |
| RNF-03 | Seguridad básica | No deben mostrarse contraseñas ni claves privadas.                          |
| RNF-04 | Rendimiento      | Las pantallas principales deben cargar de forma rápida.                     |
| RNF-05 | Organización     | El código debe mantenerse separado entre frontend, backend y base de datos. |

---

## 6. Funciones excluidas del MVP

Estas funciones quedan para etapas futuras:

* [Asistente de voz.]
* [Automatización de aplicaciones externas.]
* [Integración con calendarios.]
* [Mapa sin conexión.]
* [IA avanzada.]
* [Aplicación móvil nativa.]
* [Otra función.]

---

## 7. Historias de usuario

### HU-01

> Como [tipo de usuario], quiero [acción] para [beneficio].

Ejemplo:

> Como estudiante, quiero crear tareas con prioridad para saber qué actividades debo realizar primero.

### HU-02

> Como [tipo de usuario], quiero [acción] para [beneficio].

### HU-03

> Como [tipo de usuario], quiero [acción] para [beneficio].

---

## 8. Criterio de finalización del MVP

El MVP estará listo cuando:

* [ ] Se puedan crear tareas.
* [ ] Se puedan editar tareas.
* [ ] Se puedan eliminar tareas.
* [ ] Se puedan completar tareas.
* [ ] Se puedan crear notas.
* [ ] La interfaz sea entendible.
* [ ] No existan errores críticos conocidos.
* [ ] El proyecto esté subido y documentado en GitHub.
