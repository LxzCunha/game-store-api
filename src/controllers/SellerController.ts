import type { Request, Response } from "express";
import Seller from "../models/Seller.js";
import { respondToError } from "../http/errors.js";
import { validateBody, validateId, writeFields } from "../http/validation.js";

const writeErrors = {
    validateInput: true,
    unique: "Já existe um cadastro com o e-mail informado.",
} as const;

async function getAll(_req: Request, res: Response) {
    try {
        const records = await Seller.findAll();
        return res.status(200).json(records);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar vendedor.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do vendedor")) return;

    try {
        const record = await Seller.findById(id);
        if (record === null) {
            return res.status(404).json({ message: "Vendedor não encontrado." });
        }

        return res.status(200).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar vendedor.");
    }
}

async function create(req: Request, res: Response) {
    if (!validateBody(res, req.body, writeFields.sellers, { create: true, ignoreRole: true })) return;

    try {
        const record = await Seller.create(req.body);
        return res.status(201).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao criar vendedor.", writeErrors);
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do vendedor")) return;
    if (!validateBody(res, req.body, writeFields.sellers, { create: false, ignoreRole: true })) return;

    try {
        const record = await Seller.update(id, req.body);
        if (record === null) {
            return res.status(404).json({ message: "Vendedor não encontrado." });
        }

        return res.status(200).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao atualizar vendedor.", writeErrors);
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do vendedor")) return;

    try {
        const deleted = await Seller.remove(id);
        if (deleted === null) {
            return res.status(404).json({ message: "Vendedor não encontrado para remoção." });
        }

        return res.status(200).json({ message: "Vendedor removido com sucesso." });
    } catch (error) {
        return respondToError(res, error, "Erro ao remover vendedor.", {
            foreignKey: "Não é possível remover este vendedor pois existem pedidos vinculados a ele.",
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
