# Coach Forge - Monorepo

Monorepo para Coach Forge con aplicaciones web, mobile y backend.

## Estructura del Proyecto

```
coach-forge/
├── apps/
│   ├── web/          # Aplicación Next.js (Frontend Web)
│   ├── mobile/       # Aplicación React Native (Mobile)
│   └── backend/      # API Express (Backend)
├── packages/
│   └── shared/       # Código compartido (tipos, utilidades)
└── package.json      # Configuración del monorepo
```

## Instalación

1. Instalar dependencias en la raíz:
```bash
npm install
```

2. Construir el package compartido:
```bash
npm run build:shared
```

## Desarrollo

### Web (Next.js)
```bash
npm run dev:web
```
Abre [http://localhost:3000](http://localhost:3000)

### Mobile (React Native)
```bash
npm run dev:mobile
```

### Backend (Express)
```bash
npm run dev:backend
```
Abre [http://localhost:3001](http://localhost:3001)

## Editor de Gráficos

El editor de gráficos 2D permite:
- ✅ Agregar elementos (rectángulos, círculos, elipses, líneas, texto)
- ✅ Mover y redimensionar elementos
- ✅ Editar propiedades (color, tamaño, opacidad)
- ✅ Guardar/cargar como JSON
- ✅ Compartir código entre web y mobile mediante `@coach-forge/shared`

## Packages

### `@coach-forge/shared`
Package compartido que contiene:
- Tipos TypeScript para elementos gráficos
- Utilidades de serialización JSON
- Lógica común entre web y mobile

### `@coach-forge/web`
Aplicación Next.js con editor de gráficos usando CanvasKit (skia).

### `@coach-forge/mobile`
Aplicación React Native con editor de gráficos usando react-native-skia.

### `@coach-forge/backend`
API Express para guardar/cargar canvas desde el servidor.

## Tecnologías

- **Web**: Next.js 16, React 19, CanvasKit, Tailwind CSS
- **Mobile**: React Native, Expo, react-native-skia
- **Backend**: Express, TypeScript
- **Monorepo**: npm workspaces