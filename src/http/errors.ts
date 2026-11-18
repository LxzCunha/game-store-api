import type { ErrorRequestHandler, Response } from "express";

type ConstraintMessages = {
    unique?: string;
    foreignKey?: string;
    validateInput?: true;
};

function errorCode(error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error) {
        return error.code;
    }
}

export function respondToError(
    res: Response,
    error: unknown,
    message: string,
    constraints?: ConstraintMessages,
) {
    const code = errorCode(error);

    if (constraints && code === "23505") {
        return res.status(409).json({
            message: constraints.unique ?? "Já existe um registro com os dados informados.",
        });
    }

    if (constraints && code === "23503") {
        return res.status(409).json({
            message: constraints.foreignKey ?? "A operação conflita com um registro relacionado.",
        });
    }

    if (constraints?.validateInput
        && (code === "22P02" || code === "22003" || code === "22007" || code === "22008" || code === "23502")) {
        return res.status(400).json({ message: "Os dados informados são inválidos." });
    }

    console.error(message, error);
    return res.status(500).json({ message });
}

export const handleInvalidRequest: ErrorRequestHandler = (error: unknown, _req, res, next) => {
    if (!res.headersSent && typeof error === "object" && error !== null
        && "status" in error && error.status === 400) {
        res.status(400).json({ message: "Requisição inválida." });
        return;
    }

    next(error);
};
