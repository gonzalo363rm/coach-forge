import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración de Turbopack
  turbopack: {},

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com'
      }
    ]
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
