import type { Response } from "express";
import { ValidationError } from "../errors/ValidationError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

type ForeignKeyResponse = {
    status: 400 | 409;
    message: string;
};

export function sendError(res: Response, error: unknown, message: string, foreignKey?: ForeignKeyResponse) {
    console.error(`${message} `, error);

    if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
    }

    if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
    }

    if (error instanceof ConflictError) {
        return res.status(409).json({ message: error.message });
    }

    if (foreignKey && (error as { code?: string } | null)?.code === "23503") {
        return res.status(foreignKey.status).json({ message: foreignKey.message });
    }

    return res.status(500).json({ message });
}

export function applyActive(entity: { activate(): void; deactivate(): void }, active: unknown) {
    if (active === undefined) {
        return;
    }

    if (typeof active !== "boolean") {
        throw new ValidationError("O campo active deve ser true ou false.");
    }

    if (active) {
        entity.activate();
    } else {
        entity.deactivate();
    }
}
