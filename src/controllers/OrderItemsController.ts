import type { Request, Response } from "express";
import OrderItems from "../models/OrderItems.js";

async function getAll(req: Request, res: Response) {
    try {
        const games = await OrderItems.findAll();

        res.status(200).json(games);
    } catch (error) {
        console.error("Erro ao buscar itens do pedido: ", error);

        res.status(500).json({
            message: "Erro ao buscar itens do pedido.",
        });
    }
}


async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Item do Pedido não informado."
        })
    }

    try {
        const orderItem = await OrderItems.findById(id);

        res.status(200).json(orderItem);
    } catch (error) {
        console.error("Erro ao buscar item do pedido: ", error);

        res.status(404).json({
            message: "Item do pedido não encontrado.",
        });
    }
}

async function create(req: Request, res: Response) {
    try {
        const orderItem = await OrderItems.create(req.body);

        res.status(200).json(orderItem);
    } catch (error) {
        console.error("Erro ao criar item do pedido: ", error);

        res.status(500).json({
            message: "Erro ao criar item do pedido.",
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Item do Pedido não informado."
        })
    }

    try {
        const orderItem = await OrderItems.update(id, req.body);

        res.status(200).json(orderItem);
    } catch (error) {
        console.error("Erro ao atualizar item do pedido: ", error);

        res.status(500).json({
            message: "Erro ao atualizar item do pedido.",
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: "ID do Item do Pedido não informado."
        });
    }

    try {
        await OrderItems.remove(id);

        return res.status(200).json({
            message: "Item do pedido removido com sucesso.",
        });

    } catch (error: any) {
        console.error("Erro ao remover item do pedido: ", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Não é possível remover este item do pedido, pois ele está vinculado a um pedido."
            });
        }

        return res.status(500).json({
            message: "Erro ao remover item do pedido.",
        });
    }
}

export default {
    getAll,
    getById,
    create,
    update,
    remove
}