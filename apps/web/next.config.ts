import type { NextConfig } from "next";
import path from "path";

// Trace desde apps/web (donde está next/). Usar ../.. solo si importas @coach-forge/shared en runtime.
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "cloudinary",
  ],

  // Configuración de Turbopack
  turbopack: {},

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  
  // Configuración de webpack para CanvasKit
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Soporte para archivos WASM
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };

      // Fallbacks para módulos de Node.js que no existen en el navegador
      // CanvasKit tiene código que detecta Node.js e intenta importar estos
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };

      // Regla para archivos WASM
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
      });
    }

    return config;
  },
};

export default nextConfig;
