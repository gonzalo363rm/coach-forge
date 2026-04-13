import { jsonError, jsonResponse } from "@/lib/api/json-response"
import { sportsListAll, sportsListPaginated } from "@/services/sports.service"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const allParam = searchParams.get("all")
    const listAll = allParam === "1" || allParam === "true"

    try {
        if (listAll) {
            const sports = await sportsListAll()
            return jsonResponse({ sports })
        }

        const page = Number(searchParams.get("page") ?? "1")
        const take = Number(searchParams.get("take") ?? "10")

        if (!Number.isFinite(page) || page < 1) {
            return jsonError(400, "page debe ser un número mayor o igual a 1")
        }

        if (!Number.isFinite(take) || take < 1 || take > 100) {
            return jsonError(400, "take debe ser un número entre 1 y 100")
        }

        const result = await sportsListPaginated(page, take)
        if (!result.ok) {
            return jsonError(500, result.error)
        }
        return jsonResponse({
            sports: result.data.sports,
            currentPage: result.data.currentPage,
            totalPages: result.data.totalPages,
        })
    } catch (e) {
        console.error("[GET /api/sports]", e)
        return jsonError(500, "Error al listar deportes")
    }
}
