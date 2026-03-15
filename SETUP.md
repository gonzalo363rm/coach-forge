# Guía de Configuración - Coach Forge Monorepo

## Instalación Inicial

### 1. Instalar dependencias

Desde la raíz del proyecto:

```bash
npm install
```

Esto instalará todas las dependencias de todos los workspaces.

### 2. Construir el package compartido

El package `@coach-forge/shared` debe construirse antes de usar las apps:

```bash
npm run build:shared
```

O en modo watch (desarrollo):

```bash
cd packages/shared
npm run dev
```

## Estructura del Monorepo

```
coach-forge/
├── apps/
│   ├── web/              # Next.js app (Frontend Web)
│   │   ├── src/
│   │   │   ├── app/      # Next.js App Router
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   └── package.json
│   │
│   ├── mobile/           # React Native app (Expo)
│   │   ├── App.tsx
│   │   └── package.json
│   │
│   └── backend/          # Express API
│       ├── src/
│       │   └── index.ts
│       └── package.json
│
└── packages/
    └── shared/           # Código compartido
        ├── src/
        │   ├── types/
        │   └── utils/
        └── package.json
```

## Desarrollo

### Web App

```bash
npm run dev:web
```

Abre [http://localhost:3000](http://localhost:3000)

**Características:**
- Editor de gráficos 2D con Konva
- Agregar, mover, editar elementos
- Guardar/cargar JSON
- Interfaz responsive

### Mobile App

```bash
npm run dev:mobile
```

**Nota:** Requiere Expo CLI instalado globalmente:
```bash
npm install -g expo-cli
```

Luego ejecuta:
```bash
cd apps/mobile
npm start
```

### Backend API

```bash
npm run dev:backend
```

Abre [http://localhost:3001](http://localhost:3001)

**Endpoints:**
- `GET /api/canvas` - Listar todos los canvas
- `GET /api/canvas/:id` - Obtener canvas por ID
- `POST /api/canvas` - Crear nuevo canvas
- `PUT /api/canvas/:id` - Actualizar canvas
- `DELETE /api/canvas/:id` - Eliminar canvas

## Package Compartido

El package `@coach-forge/shared` contiene:

- **Tipos TypeScript**: `GraphicElement`, `CanvasState`, etc.
- **Utilidades**: `saveCanvasToJSON`, `loadCanvasFromJSON`

### Uso en Web o Mobile

```typescript
import { GraphicElement, CanvasState, saveCanvasToJSON } from '@coach-forge/shared';
```

## Flujo de Trabajo

1. **Desarrollo del package compartido:**
   ```bash
   cd packages/shared
   npm run dev  # Modo watch
   ```

2. **Desarrollo de la app web:**
   ```bash
   npm run dev:web
   ```

3. **Desarrollo del backend:**
   ```bash
   npm run dev:backend
   ```

## Próximos Pasos

- [ ] Implementar editor completo en mobile con react-native-skia
- [ ] Conectar web y mobile con el backend
- [ ] Agregar autenticación
- [ ] Agregar persistencia en base de datos
- [ ] Agregar sincronización en tiempo real

## Troubleshooting

### Error: Cannot find module '@coach-forge/shared'

Asegúrate de haber construido el package compartido:
```bash
npm run build:shared
```

### Error: Workspace not found

Verifica que el `package.json` raíz tenga los workspaces configurados correctamente.

### Dependencias desactualizadas

Ejecuta desde la raíz:
```bash
npm install
```

