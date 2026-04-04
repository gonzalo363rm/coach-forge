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

### API (Next.js)

La API se implementa en `apps/web` con Route Handlers (`src/app/api/...`). Con `npm run dev:web` queda disponible en el mismo origen que la web (por ejemplo `http://localhost:3000/api/...`). La app mobile puede consumir esa misma API por URL base configurable.

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

## Próximos Pasos

- [ ] Implementar editor completo en mobile con react-native-skia
- [ ] Conectar web y mobile con la API de Next
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

