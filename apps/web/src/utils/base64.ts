/** Codifica bytes en base64 en el navegador sin depender de `Buffer`. */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
    const chunkSize = 8192
    let binary = ""
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize)
        binary += String.fromCharCode(...chunk)
    }
    return btoa(binary)
}
