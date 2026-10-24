
# NEXORA — Análisis de notas

## Descripción

Prototipo para analizar el contenido de la hoja de notas de NEXORA
y clasificar fragmentos como:

- Tareas
- Objetivos
- Ideas
- Preguntas
- Decisiones
- Preocupaciones
- Conocimientos
- Fragmentos por revisar

La clasificación se realiza mediante reglas de texto en JavaScript.
No representa una interpretación perfecta ni sustituye la revisión
de la persona que escribió la nota.

## Requisitos

- Node.js 18 o superior
- npm
- El frontend React de NEXORA funcionando
- Vite, si el proyecto utiliza el puerto predeterminado 5173

Comprueba las versiones con:

```bash
node -v
npm -v
```

## 1. Instalar el backend

Abre una terminal en la carpeta backend:

```bash
cd backend
npm install
```

## 2. Iniciar el backend

En la carpeta backend:

```bash
npm run dev
```

Deberías ver un mensaje indicando que la API está disponible
en http://127.0.0.1:3001.

Para comprobar que funciona, abre en tu navegador:

http://127.0.0.1:3001/api/health

La respuesta esperada es similar a:

```json
{
  "status": "ok",
  "service": "NEXORA Notes API"
}
```

## 3. Conectar el frontend

El servicio de conexión se encuentra en:

frontend/src/services/noteAnalysis.js

Si tu frontend utiliza Vite y el puerto 5173, la configuración
predeterminada debería funcionar sin cambios.

Si el frontend utiliza otro origen, adapta la lista `origin`
en `backend/server.js` para autorizar el origen correcto.

## 4. Integrar con App.jsx

Consulta el archivo `INTEGRACION_APP.jsx.txt`.

Añade el import, los estados, la función de análisis, el botón
y el bloque de resultados en los lugares indicados.

No reemplaces el App.jsx existente: contiene la interfaz actual
de NEXORA.

## 5. Aplicar los estilos

Copia el contenido de `App.css.additions.css` al final de:

frontend/src/App.css

No reemplaces el CSS existente.

## 6. Iniciar el frontend

Abre una segunda terminal desde la carpeta raíz de NEXORA:

```bash
cd frontend
npm run dev
```

Si el frontend ya tiene un servidor activo, no necesitas iniciar
una segunda instancia.

## Privacidad y limitaciones

- La API no guarda las notas en una base de datos.
- El texto se recibe y procesa en memoria durante la solicitud.
- La API no envía intencionalmente las notas a servicios externos.
- El borrador original continúa gestionándose con el mecanismo
  de almacenamiento que ya tenga el frontend.
- La clasificación se basa en patrones de palabras y expresiones.
- Revisa las categorías antes de utilizar los resultados como
  decisiones, compromisos o tareas definitivas.

Este prototipo está pensado para ejecutarse localmente. No está
preparado para exponerse directamente a Internet sin implementar
autenticación, controles adicionales y medidas de seguridad.
