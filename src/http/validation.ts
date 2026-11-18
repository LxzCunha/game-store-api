import type { Response } from "express";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isDate(value: unknown) {
    if (typeof value !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) || value.startsWith("0000-")) {
        return false;
    }

    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const validators = {
    uuid: (value: unknown) => typeof value === "string" && uuidPattern.test(value),
    text: (value: unknown) => typeof value === "string" && !value.includes("\0"),
    email: (value: unknown) => typeof value === "string" && /^[^\s@\0]+@[^\s@\0]+$/.test(value),
    boolean: (value: unknown) => typeof value === "boolean",
    integer: (value: unknown) => typeof value === "number" && Number.isInteger(value)
        && value >= -2147483648 && value <= 2147483647,
    decimal: (value: unknown) => typeof value === "number" && Math.abs(value) < 100_000_000,
    date: isDate,
};

type Field = {
    type: keyof typeof validators;
    required?: true;
    nullable?: true;
};

type Schema = Record<string, Field>;

const personFields = {
    name: { type: "text", required: true },
    email: { type: "email", required: true },
    phone: { type: "text", nullable: true },
    address: { type: "text", nullable: true },
} satisfies Schema;

export const writeFields = {
    genres: {
        name: { type: "text", required: true },
        description: { type: "text", nullable: true },
        active: { type: "boolean" },
    },
    games: {
        genre_id: { type: "uuid", required: true },
        title: { type: "text", required: true },
        description: { type: "text", nullable: true },
        price: { type: "decimal", required: true },
        stock_quantity: { type: "integer" },
        release_date: { type: "date", nullable: true },
        developer: { type: "text", nullable: true },
        image: { type: "text", nullable: true },
        active: { type: "boolean" },
    },
    customers: {
        ...personFields,
        birth_date: { type: "date", nullable: true },
    },
    sellers: {
        ...personFields,
        hire_date: { type: "date", nullable: true },
    },
    orders: {
        customer_id: { type: "uuid", required: true },
        seller_id: { type: "uuid", required: true },
        order_date: { type: "date" },
        status: { type: "text" },
        total: { type: "decimal" },
        active: { type: "boolean" },
    },
    orderItems: {
        order_id: { type: "uuid", required: true },
        game_id: { type: "uuid", required: true },
        quantity: { type: "integer", required: true },
        unit_price: { type: "decimal", required: true },
    },
} satisfies Record<string, Schema>;

export function validateId(res: Response, id: string, label: string) {
    if (validators.uuid(id)) return true;

    res.status(400).json({ message: `O ID ${label} deve ser um UUID válido.` });
    return false;
}

export function validateBody(
    res: Response,
    body: unknown,
    schema: Schema,
    { create, ignoreRole = false }: { create: boolean; ignoreRole?: boolean },
) {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        res.status(400).json({ message: "O corpo da requisição deve ser um objeto JSON." });
        return false;
    }

    const entries = Object.entries(body);
    if (!create && entries.length === 0) {
        res.status(400).json({ message: "Informe ao menos um campo para atualizar." });
        return false;
    }

    for (const [name, value] of entries) {
        if (ignoreRole && name === "role") continue;

        const field = Object.hasOwn(schema, name) ? schema[name] : undefined;
        if (!field) {
            res.status(400).json({ message: `Campo não reconhecido: ${name}.` });
            return false;
        }

        if (!(value === null && field.nullable) && !validators[field.type](value)) {
            res.status(400).json({ message: `Valor inválido para o campo ${name}.` });
            return false;
        }
    }

    if (create) {
        for (const [name, field] of Object.entries(schema)) {
            if (field.required && !Object.hasOwn(body, name)) {
                res.status(400).json({ message: `Campo obrigatório: ${name}.` });
                return false;
            }
        }
    }

    return true;
}
