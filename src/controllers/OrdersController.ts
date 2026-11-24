import type { Request, Response } from "express";
import Orders from "../models/Orders.js";
import { respondToError } from "../http/errors.js";
import { validateBody, validateId, writeFields } from "../http/validation.js";

const writeErrors = {
    validateInput: true,
    foreignKey: "O cliente ou vendedor informado não existe.",
} as const;

async function getAll(_req: Request, res: Response) {
    try {
        const records = await Orders.findAll();
        return res.status(200).json(records);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar pedidos.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do pedido")) return;

    try {
        const record = await Orders.findById(id);
        if (record === null) {
            return res.status(404).json({ message: "Pedido não encontrado." });
        }

        return res.status(200).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar pedido.");
    }
}

async function getByCustomer(req: Request<{ customerId: string }>, res: Response) {
    const { customerId } = req.params;
    if (!validateId(res, customerId, "do cliente")) return;

    try {
        const records = await Orders.findByCustomer(customerId);
        return res.status(200).json(records);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar pedidos do cliente.");
    }
}

async function getBySeller(req: Request<{ sellerId: string }>, res: Response) {
    const { sellerId } = req.params;
    if (!validateId(res, sellerId, "do vendedor")) return;

    try {
        const records = await Orders.findBySeller(sellerId);
        return res.status(200).json(records);
    } catch (error) {
        return respondToError(res, error, "Erro ao buscar pedidos do vendedor.");
    }
}

async function create(req: Request, res: Response) {
    if (!validateBody(res, req.body, writeFields.orders, { create: true })) return;

    try {
        const record = await Orders.create(req.body);
        return res.status(201).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao criar pedido.", writeErrors);
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do pedido")) return;
    if (!validateBody(res, req.body, writeFields.orders, { create: false })) return;

    try {
        const record = await Orders.update(id, req.body);
        if (record === null) {
            return res.status(404).json({ message: "Pedido não encontrado." });
        }

        return res.status(200).json(record);
    } catch (error) {
        return respondToError(res, error, "Erro ao atualizar pedido.", writeErrors);
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    if (!validateId(res, id, "do pedido")) return;

    try {
        const deleted = await Orders.remove(id);
        if (deleted === null) {
            return res.status(404).json({ message: "Pedido não encontrado para remoção." });
        }

        return res.status(200).json({ message: "Pedido removido com sucesso." });
    } catch (error) {
        return respondToError(res, error, "Erro ao remover pedido.", {
            foreignKey: "Não é possível remover este pedido, pois ele possui itens vinculados.",
        });
    }
}

export default {
    getAll,
    getById,
    getByCustomer,
    getBySeller,
    create,
    update,
    remove,
};
