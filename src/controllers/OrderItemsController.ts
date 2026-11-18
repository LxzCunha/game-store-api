import type { Request, Response } from "express";
import OrderItems from "../models/OrderItems.js";
import { respondToError } from "../http/errors.js";
import { validateBody, validateId, writeFields } from "../http/validation.js";

const writeErrors = {
    validateInput: true,
    foreignKey: "O pedido ou jogo informado não existe.",
} as const;

async function getAll(_req: Request, res: Response) {
    try {
        const records = await OrderItems.findAll();
        return res.status(200).json(records);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar itens do pedido.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do item do pedido")) return;

    try {
        const record = await OrderItems.findById(id);
        if (record === null) {
            return res.status(404).json({ message: "Item do pedido não encontrado." });
        }

        return res.status(200).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar item do pedido.");
    }
}

async function getByOrder(req: Request<{ orderId: string }>, res: Response) {
    const { orderId } = req.params;
    if (!validateId(res, orderId, "do pedido")) return;

    try {
        const records = await OrderItems.findByOrder(orderId);
        return res.status(200).json(records);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar itens do pedido.");
    }
}

async function create(req: Request, res: Response) {
    if (!validateBody(res, req.body, writeFields.orderItems, { create: true })) return;

    try {
        const record = await OrderItems.create(req.body);
        return res.status(201).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao criar item do pedido.", writeErrors);
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do item do pedido")) return;
    if (!validateBody(res, req.body, writeFields.orderItems, { create: false })) return;

    try {
        const record = await OrderItems.update(id, req.body);
        if (record === null) {
            return res.status(404).json({ message: "Item do pedido não encontrado." });
        }

        return res.status(200).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao atualizar item do pedido.", writeErrors);
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do item do pedido")) return;

    try {
        const deleted = await OrderItems.remove(id);
        if (deleted === null) {
            return res.status(404).json({ message: "Item do pedido não encontrado para remoção." });
        }

        return res.status(200).json({ message: "Item do pedido removido com sucesso." });
    } catch (error) {
        return respondToError(res, error, "Erro ao remover item do pedido.", {
            foreignKey: "Não é possível remover este item do pedido por causa de um vínculo com outro registro.",
        });
    }
}

export default {
    getAll,
    getById,
    getByOrder,
    create,
    update,
    remove,
};
