import { z } from "zod"

/** Tamaño máximo del cuerpo HTTP (bytes UTF-8) antes de parsear JSON. */
export const MAX_REQUEST_BODY_BYTES = 1_048_576

/** Tamaño máximo de `JSON.stringify(canvas)` tras validar estructura. */
export const MAX_CANVAS_JSON_CHARS = 600_000

const optionalStyle = z
    .object({
        fillColor: z.string().optional(),
        strokeColor: z.string().optional(),
        strokeWidth: z.number().optional(),
        dash: z.array(z.number()).optional(),
        opacity: z.number().optional(),
    })
    .optional()

/** Campos mínimos; el editor añade datos del catálogo (name, image, width, height, …). */
const baseElement = z
    .object({
        id: z.union([z.string(), z.null()]),
        definitionId: z.string(),
        x: z.number(),
        y: z.number(),
        rotation: z.number().optional(),
        scale: z.number().optional(),
        zIndex: z.number().optional(),
        label: z.string().optional(),
        description: z.string().optional(),
        order: z.number().optional(),
        assignedPlayers: z.array(z.string()).optional(),
        style: optionalStyle,
    })
    .passthrough()

const imageData = z
    .object({
        width: z.number(),
        height: z.number(),
        imageRef: z.union([z.string(), z.null()]),
        maintainAspectRatio: z.boolean().optional(),
    })
    .passthrough()

const imageEl = baseElement
    .extend({
        type: z.literal("image"),
        data: imageData,
    })
    .passthrough()

const playerEl = baseElement
    .extend({
        type: z.literal("player"),
        data: imageData,
    })
    .passthrough()

const arrowEl = baseElement
    .extend({
        type: z.literal("arrow"),
        data: z
            .object({
                points: z.array(z.tuple([z.number(), z.number()])).min(2),
            })
            .passthrough(),
    })
    .passthrough()

const circleEl = baseElement
    .extend({
        type: z.literal("circle"),
        data: z
            .object({
                radius: z.number(),
            })
            .passthrough(),
    })
    .passthrough()

const rectEl = baseElement
    .extend({
        type: z.literal("rect"),
        data: z
            .object({
                width: z.number(),
                height: z.number(),
                cornerRadius: z.number().optional(),
            })
            .passthrough(),
    })
    .passthrough()

const lineEl = baseElement
    .extend({
        type: z.literal("line"),
        data: z
            .object({
                start: z.tuple([z.number(), z.number()]),
                end: z.tuple([z.number(), z.number()]),
            })
            .passthrough(),
    })
    .passthrough()

const imageOrPlayer = z.union([imageEl, playerEl])

export const exerciseCanvasSchema = z
    .object({
        width: z.number().finite(),
        height: z.number().finite(),
        backgroundColor: z.string(),
        zoom: z.number().finite(),
        showTitleOverlay: z.boolean(),
        showOrderOverlay: z.boolean(),
        images: z.array(imageOrPlayer),
        circles: z.array(circleEl),
        rects: z.array(rectEl),
        lines: z.array(lineEl),
        arrows: z.array(arrowEl),
    })
    .strict()

/** `undefined` en JSON (clave ausente) → `null` para campos que en BD son opcionales. */
const undefinedToNull = (v: unknown) => (v === undefined ? null : v)

export const exerciseCreateSchema = z
    .object({
        sportId: z.preprocess(
            undefinedToNull,
            z.union([z.string().min(1), z.null()]),
        ),
        title: z.string().max(500),
        minPlayers: z.preprocess(
            undefinedToNull,
            z.union([z.number().int().positive(), z.null()]),
        ),
        maxPlayers: z.preprocess(
            undefinedToNull,
            z.union([z.number().int().positive(), z.null()]),
        ),
        difficulty: z.number().int().min(1).max(5),
        videoLink: z.preprocess(
            (v) => (v === "" || v === undefined ? null : v),
            z.union([z.string().max(2000), z.null()]).optional(),
        ),
        canvas: exerciseCanvasSchema,
    })
    .strict()
    .superRefine((data, ctx) => {
        if (
            data.minPlayers != null &&
            data.maxPlayers != null &&
            data.minPlayers > data.maxPlayers
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "minPlayers no puede ser mayor que maxPlayers",
                path: ["minPlayers"],
            })
        }
        const canvasJson = JSON.stringify(data.canvas)
        if (canvasJson.length > MAX_CANVAS_JSON_CHARS) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `canvas excede ${MAX_CANVAS_JSON_CHARS} caracteres al serializar`,
                path: ["canvas"],
            })
        }
    })

export const exerciseUpdateSchema = z
    .object({
        sportId: z.union([z.string().min(1), z.null()]).optional(),
        title: z.string().max(500).optional(),
        minPlayers: z.union([z.number().int().positive(), z.null()]).optional(),
        maxPlayers: z.union([z.number().int().positive(), z.null()]).optional(),
        difficulty: z.number().int().min(1).max(5).optional(),
        videoLink: z.preprocess(
            (v) => (v === "" ? null : v),
            z.union([z.string().max(2000), z.null()]).optional(),
        ),
        canvas: exerciseCanvasSchema.optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: "Se requiere al menos un campo para actualizar",
    })
    .superRefine((data, ctx) => {
        if (
            data.minPlayers != null &&
            data.maxPlayers != null &&
            data.minPlayers > data.maxPlayers
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "minPlayers no puede ser mayor que maxPlayers",
                path: ["minPlayers"],
            })
        }
        if (data.canvas !== undefined) {
            const canvasJson = JSON.stringify(data.canvas)
            if (canvasJson.length > MAX_CANVAS_JSON_CHARS) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `canvas excede ${MAX_CANVAS_JSON_CHARS} caracteres al serializar`,
                    path: ["canvas"],
                })
            }
        }
    })

export type ExerciseCreateInput = z.infer<typeof exerciseCreateSchema>
export type ExerciseUpdateInput = z.infer<typeof exerciseUpdateSchema>
