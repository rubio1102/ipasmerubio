# IPASME Rubio - Sistema de citas médicas

Aplicación web responsive para la gestión de citas médicas de la Unidad Médica IPASME Rubio.

## Requisitos

- Node.js 18+
- Cuenta de Supabase opcional para persistencia real

## Instalación

```bash
npm install
cp .env.example .env
```

Completa con tus credenciales de Supabase si quieres usarla como base de datos:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
PORT=3000
```

Luego crea la tabla `app_data` ejecutando el contenido de [supabase_schema.sql](./supabase_schema.sql).

## Ejecución

```bash
npm start
```

La app queda disponible en http://localhost:3000.

## Portal administrativo

El acceso administrativo se realiza desde una ruta independiente: http://localhost:3000/admin

## Credenciales demo

- Administrador: `admin` / `Admin123!`
- Coordinador: `coordinador` / `Coordinador123!`

## Funcionalidades principales

- Información institucional pública editable desde administración.
- Registro de beneficiarios y verificación de correo.
- Solicitud de citas con validación de especialidad, médico, fecha, turno y horario.
- Historial de citas por beneficiario.
- Panel administrativo para contenido, especialidades, médicos y reportes.
- Integración opcional con Supabase para persistencia real.
