import { spawnSync } from "node:child_process";
import path from "path";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  disable: process.env.NODE_ENV === "development",
});

// Monorepo: raíz del repo (apps/web → ../..). No usar ../../.. (sale del repo y rompe el trace en Vercel).
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),

  experimental: {
    serverActions: {
      // Previews WebP a 2× pueden superar 2 MB en base64.
      bodySizeLimit: "5mb",
    },
  },

  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "cloudinary",
  ],

  // Turbopack (next dev): equivalente a resolve.fallback de webpack para CanvasKit
  turbopack: {
    resolveAlias: {
      fs: { browser: "./empty-node-module.ts" },
      path: { browser: "./empty-node-module.ts" },
    },
  },

  images: {
    qualities: [75, 90, 95],
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
        type: "asset/resource",
      });
    }

    return config;
  },
};

export default withSerwist(nextConfig);
