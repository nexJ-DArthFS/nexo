# Seguridad y privacidad — NEXORA

## 1. Propósito

NEXORA será una plataforma de organización personal que, en versiones futuras, podría manejar tareas, notas, cuentas de usuario, recordatorios, información de productividad e integraciones con inteligencia artificial.

Por esta razón, la seguridad y la privacidad deben considerarse desde el inicio del proyecto, aunque el MVP inicial use únicamente datos de prueba.

---

## 2. Principios de seguridad

NEXORA deberá seguir estos principios:

1. **Privacidad por defecto:** recopilar únicamente los datos necesarios para que una función opere.
2. **Mínimo acceso:** cada usuario solo podrá acceder a sus propios datos.
3. **Protección de credenciales:** las contraseñas, claves API y tokens nunca deberán exponerse en el código ni en GitHub.
4. **Separación de datos:** los datos de prueba deberán mantenerse separados de los datos reales.
5. **Seguridad progresiva:** las medidas de seguridad deberán aumentar conforme NEXORA incorpore funciones más sensibles.
6. **Transparencia:** el usuario deberá conocer qué información se almacena y para qué se utiliza.

---

## 3. Datos previstos

En el MVP inicial, NEXORA podría manejar:

* Tareas.
* Notas.
* Prioridades.
* Fechas límite.
* Estados de tareas: pendiente o completada.
* Datos de prueba para validar el funcionamiento.

En versiones futuras, NEXORA podría manejar:

* Nombre de usuario.
* Correo electrónico.
* Preferencias personales.
* Historial de organización.
* Información introducida en el asistente conversacional.
* Integraciones con calendarios, correo u otros servicios autorizados por el usuario.

---

## 4. Datos que no deben subirse a GitHub

Nunca se deben subir al repositorio público o privado de GitHub:

* Contraseñas.
* Claves API.
* Tokens de acceso.
* Archivos `.env`.
* Credenciales de conexión a la base de datos.
* Bases de datos reales de usuarios.
* Información personal real de usuarios.
* Capturas de pantalla que muestren datos sensibles.
* Archivos de configuración privada del equipo.

---

## 5. Uso de variables de entorno

Las claves privadas deberán guardarse en archivos de entorno, por ejemplo:

```text
.env
```

Ejemplo de estructura futura:

```env
DATABASE_URL=valor_privado
API_KEY=valor_privado
SECRET_KEY=valor_privado
```

El archivo `.env` deberá permanecer incluido en `.gitignore` para evitar que Git lo suba a GitHub.

Cuando sea necesario compartir la estructura de las variables sin compartir secretos, se podrá usar:

```text
.env.example
```

Ejemplo:

```env
DATABASE_URL=
API_KEY=
SECRET_KEY=
```

---

## 6. Contraseñas y cuentas de usuario

Cuando NEXORA implemente registro e inicio de sesión:

* Las contraseñas no deberán guardarse en texto plano.
* Las contraseñas deberán transformarse mediante un método de hash seguro.
* Cada usuario deberá acceder únicamente a sus propias tareas y notas.
* Se deberá validar el correo electrónico y los datos de entrada.
* Se deberá evitar mostrar información privada en mensajes de error.
* Las sesiones deberán cerrarse de forma segura.

---

## 7. Seguridad de tareas y notas

Las tareas y notas pueden contener información personal, académica o profesional. Por ello:

* Cada registro deberá estar asociado a un usuario.
* Un usuario no deberá poder consultar, modificar o eliminar información de otro usuario.
* La aplicación deberá validar los datos antes de guardarlos.
* No se deberán usar datos reales durante pruebas iniciales.
* Las copias de seguridad deberán planificarse antes de almacenar información importante.

---

## 8. Uso futuro de inteligencia artificial

NEXORA podría integrar modelos de inteligencia artificial para asistencia conversacional, organización y automatización.

Antes de implementar esta función se deberá definir:

* Qué información se enviará al servicio de IA.
* Qué información no podrá enviarse.
* Si el usuario autoriza explícitamente el uso de sus datos.
* Cómo se almacenarán o eliminarán las conversaciones.
* Qué proveedor de IA se utilizará.
* Qué medidas evitarán la exposición accidental de información privada.

La inteligencia artificial deberá funcionar como una herramienta de apoyo y no deberá tomar decisiones críticas sin autorización del usuario.

---

## 9. Criptografía y protección futura

En futuras versiones se podrá evaluar el uso de mecanismos criptográficos para proteger información sensible.

Posibles áreas de aplicación:

* Protección de comunicaciones entre frontend y backend.
* Cifrado de datos sensibles almacenados.
* Manejo seguro de claves.
* Firmas digitales o autenticación avanzada.
* Protección de estructuras de datos privadas.

La implementación de criptografía avanzada, incluyendo posibles métodos basados en curvas elípticas, deberá analizarse técnicamente antes de incorporarse. No se implementará un sistema criptográfico propio sin conocimientos especializados y pruebas de seguridad.

---

## 10. Riesgos iniciales

| Riesgo                             | Posible consecuencia                                | Medida preventiva                         |
| ---------------------------------- | --------------------------------------------------- | ----------------------------------------- |
| Subir una clave API a GitHub       | Uso no autorizado de servicios o costos inesperados | Usar `.env` y mantenerlo en `.gitignore`  |
| Guardar contraseñas sin protección | Exposición de cuentas de usuario                    | Usar hash seguro y nunca texto plano      |
| Usar datos reales durante pruebas  | Pérdida o exposición de privacidad                  | Trabajar inicialmente con datos ficticios |
| Falta de validación de datos       | Errores o información incorrecta                    | Validar datos en frontend y backend       |
| Permitir acceso entre usuarios     | Exposición de tareas o notas privadas               | Asociar cada dato a su propietario        |
| Dependencia de servicios externos  | Interrupciones o exposición de información          | Revisar permisos y limitar datos enviados |

---

## 11. Reglas obligatorias para el desarrollo

Antes de hacer un `git add .` o subir cambios, se deberá comprobar que no existan:

* Archivos `.env`.
* Claves API.
* Contraseñas.
* Tokens.
* Datos reales de usuarios.
* Archivos de base de datos privados.
* Configuraciones locales no necesarias.

Antes de usar una nueva integración externa, se deberá registrar la decisión en:

```text
docs/decisiones-tecnicas.md
```

---

## 12. Estado actual

**Estado:** Planificación inicial de seguridad.

**Aplicación actual:** El MVP trabajará con datos de prueba y no almacenará información personal real hasta que se implementen autenticación, validación y protección de datos.

**Siguiente paso:**

> Definir las decisiones tecnológicas iniciales para frontend, backend y almacenamiento de datos.
