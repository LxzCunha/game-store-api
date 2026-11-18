import type { Request, Response } from "express";
import Customer from "../models/Customer.js";
import { respondToError } from "../http/errors.js";
import { validateBody, validateId, writeFields } from "../http/validation.js";

const writeErrors = {
    validateInput: true,
    unique: "Já existe um cadastro com o e-mail informado.",
} as const;

async function getAll(_req: Request, res: Response) {
    try {
        const records = await Customer.findAll();
        return res.status(200).json(records);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar cliente.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do cliente")) return;

    try {
        const record = await Customer.findById(id);
        if (record === null) {
            return res.status(404).json({ message: "Cliente não encontrado." });
        }

        return res.status(200).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar cliente.");
    }
}

async function create(req: Request, res: Response) {
    if (!validateBody(res, req.body, writeFields.customers, { create: true, ignoreRole: true })) return;

    try {
        const record = await Customer.create(req.body);
        return res.status(201).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao criar cliente.", writeErrors);
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do cliente")) return;
    if (!validateBody(res, req.body, writeFields.customers, { create: false, ignoreRole: true })) return;

    try {
        const record = await Customer.update(id, req.body);
        if (record === null) {
            return res.status(404).json({ message: "Cliente não encontrado." });
        }

        return res.status(200).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao atualizar cliente.", writeErrors);
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do cliente")) return;

    try {
        const deleted = await Customer.remove(id);
        if (deleted === null) {
            return res.status(404).json({ message: "Cliente não encontrado para remoção." });
        }

        return res.status(200).json({ message: "Cliente removido com sucesso." });
    } catch (error) {
        return respondToError(res, error, "Erro ao remover cliente.", {
            foreignKey: "Não é possível remover este cliente pois existem pedidos vinculados a ele.",
        });
    }
}

export default {
    getAll,
    getById,
    create,
    update,
    remove,
};
