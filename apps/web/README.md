# Coach Forge — Web

Aplicación web de Coach Forge: panel para entrenadores y administradores, editor de ejercicios con canvas 2D y API integrada en Next.js (App Router + Server Actions).

Parte del monorepo [`coach-forge`](../../README.md). La UI y la lógica de servidor viven aquí; la app mobile consume la misma API cuando corresponda.

## Stack

| Área | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Auth | Auth.js (NextAuth v5), sesión JWT |
| Base de datos | PostgreSQL + Prisma 7 (adapter `pg`) |
| Imágenes | Cloudinary |
| Email | Resend (opcional en dev) |
| Canvas | CanvasKit (Skia WASM) |
| Estado UI | Zustand (toasts, navegación) |

## Qué incluye

- **Autenticación:** registro, login, verificación de email, recuperación de contraseña.
- **Roles:** `coach` (usuario), `admin` y `superadmin` (panel de administración).
- **Ejercicios:** editor gráfico con elementos del deporte, preview exportado como imagen.
- **Clases de entrenamiento:** composición de ejercicios, modo “iniciar clase” con temporizador.
- **Admin:** usuarios, deportes, elementos del canvas y listados globales de ejercicios/clases.
- **API REST:** rutas en `src/app/api/` (ejercicios, elementos, deportes) además de Server Actions.

## Estructura del proyecto

```
apps/web/
├── prisma/
│   ├── schema.prisma      # Modelos (User, Exercise, Sport, Element, TrainingClass…)
│   ├── migrations/        # Migraciones SQL
│   └── seed.ts            # Datos iniciales (superadmin)
├── public/
│   └── canvaskit/         # WASM de CanvasKit (generado en postinstall/build)
├── scripts/
│   └── copy-canvaskit.mjs
├── src/
│   ├── app/               # Rutas, páginas, Server Actions, API
│   ├── components/        # UI, editor, tablas, auth
│   ├── services/          # Lógica de negocio (auth, cloudinary, ejercicios…)
│   ├── lib/               # Prisma, Cloudinary, permisos, utilidades
│   ├── schemas/           # Validación Zod
│   ├── stores/            # Zustand
│   ├── auth.ts            # NextAuth (servidor)
│   └── auth.config.ts     # Config compartida (middleware/proxy)
├── .env.example
└── prisma.config.ts
```

## Requisitos

- **Node.js** 20+ (recomendado LTS)
- **PostgreSQL** accesible vía `DATABASE_URL`
- Cuenta **Cloudinary** (opcional en dev; sin ella no se suben imágenes)
- Cuenta **Resend** (opcional; sin ella los enlaces de email se imprimen en consola)

## Primer arranque

### 1. Instalar dependencias

Desde la raíz del monorepo:

```bash
npm install
```

### 2. Variables de entorno

Copia el ejemplo y completa los valores:

```bash
cp .env.example .env
```

Desde `apps/web/` (o usa `.env.local` si prefieres el convención de Next.js):

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `AUTH_SECRET` | Secreto de sesión. Generar: `npx auth secret` |
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| `RESEND_API_KEY` | API key de Resend (opcional en dev) |
| `EMAIL_FROM` | Remitente de emails transaccionales |

### 3. Base de datos

Ejecuta desde `apps/web/`:

```bash
# Aplicar migraciones
npm run db:migrate

# Generar cliente Prisma (también corre en build)
npm run db:generate

# Poblar usuario superadmin inicial
npm run db:seed
```

Desde la raíz del monorepo puedes usar `npm run db:migrate` y `npm run db:seed` (delegan a este workspace).

**Usuario seed (solo desarrollo):**

| Campo | Valor |
|-------|-------|
| Email | `admin@admin.com` |
| Contraseña | `admin123` |
| Rol | `superadmin` |

El seed es idempotente: puedes ejecutarlo varias veces; actualiza contraseña y rol si el usuario ya existe.

> No uses estas credenciales en producción.

### 4. Desarrollo

Desde la raíz:

```bash
npm run dev:web
```

O desde `apps/web/`:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 5. Producción local

```bash
npm run build
npm run start
```

El build ejecuta `prisma generate`, copia CanvasKit a `public/canvaskit/` y compila con webpack (requerido por WASM).

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor tras build |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:push` | Sincronizar schema sin migración (solo dev) |
| `npm run db:seed` | Ejecutar `prisma/seed.ts` |
| `npm run db:studio` | Prisma Studio |

## Imágenes en Cloudinary

Las imágenes **no se guardan en disco ni en la base de datos** como binarios. Se suben a Cloudinary y en PostgreSQL solo queda la URL o el identificador necesario para reconstruirla.

**Carpetas** (ver `src/lib/cloudinary-folders.ts`):

```
coach-forge/{entorno}/avatars      # Avatares de usuario
coach-forge/{entorno}/exercises    # Preview de ejercicios
coach-forge/{entorno}/elements     # Imágenes de elementos del canvas
```

`{entorno}` es `development` o `production` según `NODE_ENV`. Así dev y prod no pisan las mismas rutas en la misma cuenta de Cloudinary.

**Configuración:** define `CLOUDINARY_URL` en `.env`. Si falta, la app sigue funcionando pero las subidas de imagen fallarán o se omitirán según el flujo.

**Dominios permitidos** para `next/image`: `res.cloudinary.com` (y otros configurados en `next.config.ts`).

## Autenticación y permisos

- Login en `/login`; registro en `/register`.
- Los coaches gestionan sus ejercicios (`/exercises/mine`) y clases (`/classes/mine`).
- Rutas `/admin/*` requieren rol `admin` o `superadmin`.
- Solo `superadmin` puede asignar roles y ver otros superadmins (`src/lib/user-permissions.ts`).

La sesión usa JWT; el middleware/proxy protege rutas privadas (`src/proxy.ts`, `src/auth.config.ts`).

## Editor de ejercicios

- Canvas 2D con **CanvasKit** (Skia en WASM).
- Los binarios WASM se copian a `public/canvaskit/` en `postinstall` y antes del build.
- El editor se carga en cliente (`dynamic` + `ssr: false`) para no bloquear el SSR.
- El estado del canvas se persiste como JSON en la columna `Exercise.canvas`.

## Despliegue (Vercel)

- **Root Directory:** `apps/web`
- Variables de entorno: las mismas que en `.env.example` (sobre todo `DATABASE_URL`, `AUTH_SECRET`, `CLOUDINARY_URL`).
- Tras el primer deploy, ejecuta migraciones contra la DB de producción (`npm run db:migrate` en CI o manualmente).
- El seed **no** debe correrse automáticamente en producción salvo que lo configures tú de forma explícita.

## Troubleshooting

**`DATABASE_URL no está definida`**  
Crea `.env` o `.env.local` en `apps/web/` con una URL válida.

**CanvasKit / WASM en blanco**  
Ejecuta `node scripts/copy-canvaskit.mjs` o `npm install` (postinstall).

**Prisma / tipos desactualizados**  
`npm run db:generate`

**No puedo iniciar sesión tras registrarme**  
Verifica el email (en dev el enlace sale en consola si no hay Resend) o usa el usuario del seed.

**Imágenes rotas**  
Comprueba `CLOUDINARY_URL`, que la carpeta `coach-forge/{entorno}/…` exista en tu cuenta y que `NODE_ENV` coincida con el entorno donde subiste los archivos.
