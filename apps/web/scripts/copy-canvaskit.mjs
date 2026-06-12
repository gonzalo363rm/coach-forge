import { cpSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const webRoot = join(scriptDir, "..")
const srcDir = join(webRoot, "node_modules", "canvaskit-wasm", "bin", "full")
const destDir = join(webRoot, "public", "canvaskit")

if (!existsSync(srcDir)) {
    console.warn("[copy-canvaskit] canvaskit-wasm no instalado; omitiendo copia.")
    process.exit(0)
}

mkdirSync(destDir, { recursive: true })

for (const file of ["canvaskit.wasm", "canvaskit.js"]) {
    cpSync(join(srcDir, file), join(destDir, file))
}

console.log("[copy-canvaskit] Archivos copiados a public/canvaskit/")
