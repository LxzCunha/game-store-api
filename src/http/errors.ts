import type { ErrorRequestHandler } from "express";

export const handleInvalidRequest: ErrorRequestHandler = (error: unknown, _req, res, next) => {
    if (!res.headersSent && typeof error === "object" && error !== null
        && "status" in error && error.status === 400) {
        res.status(400).json({ message: "Requisição inválida." });
        return;
    }

    next(error);
};
