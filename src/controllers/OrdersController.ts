import type { Request, Response } from "express";
import Orders  from "../models/Orders.js";

async function getAll(req: Request, res: Response) {
    try {
        const orders = await Orders.findAll();

        res.status(200).json(orders);
    } catch (error) {
        console.error("Erro ao buscar pedidos: ", error);

        res.status(500).json({
            message: "Erro ao buscar pedidos.",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Pedido não informado."
        })
    }

    try {
        const order = await Orders.findById(id);

        res.status(200).json(order);
    } catch (error) {
        console.error("Erro ao buscar pedido: ", error);

        res.status(404).json({
            message: "Pedido não encontrado.",
        });
    }
}

async function getByCustomer(req: Request<{ customerId: string }>, res: Response) {
    const { customerId } = req.params;

    if (!customerId) {
        return res.status(400).json({
            message: "ID do Cliente não informado."
        });
    }

    try {
        const orders = await Orders.findByCustomer(customerId);

        res.status(200).json(orders);
    } catch (error) {
        console.error("Erro ao buscar pedidos do cliente: ", error);

        res.status(500).json({
            message: "Erro ao buscar pedidos do cliente.",
        });
    }
}

async function getBySeller(req: Request<{ sellerId: string }>, res: Response) {
    const { sellerId } = req.params;

    if (!sellerId) {
        return res.status(400).json({
            message: "ID do Vendedor não informado."
        });
    }

    try {
        const orders = await Orders.findBySeller(sellerId);

        res.status(200).json(orders);
    } catch (error) {
        console.error("Erro ao buscar pedidos do vendedor: ", error);

        res.status(500).json({
            message: "Erro ao buscar pedidos do vendedor.",
        });
    }
}

async function create(req: Request, res: Response) {
    try {
        const order = await Orders.create(req.body);

        res.status(201).json(order);
    } catch (error) {
        console.error("Erro ao criar pedido: ", error);

        res.status(500).json({
            message: "Erro ao criar pedido.",
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Pedido não informado."
        })
    }

    try {
        const order = await Orders.update(id, req.body);

        res.status(200).json(order);
    } catch (error) {
        console.error("Erro ao atualizar pedido: ", error);

        res.status(500).json({
            message: "Erro ao atualizar pedido.",
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({
            message: "ID do Pedido não informado."
        });
    }

    try {
        await Orders.remove(id);

        return res.status(200).json({
            message: "Pedido removido com sucesso.",
        });

    } catch (error: any) {
        console.error("Erro ao remover pedido: ", error);

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Não é possível remover este pedido, pois ele está vinculado a um item pedido."
            });
        }

        return res.status(500).json({
            message: "Erro ao remover pedido.",
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
    remove
}