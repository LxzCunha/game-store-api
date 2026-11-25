import type { Request, Response } from "express";
import OrderItemsRepository from "../repository/OrderItemsRepository.js";
import { OrderItem } from "../models/OrderItems.js";
import { sendError } from "./helpers.js";

const ORDER_OR_GAME_NOT_FOUND = {
    status: 400,
    message: "O pedido ou o jogo informado não existe."
} as const;

async function getAll(req: Request, res: Response) {
    try {
        const orderItems = await OrderItemsRepository.findAll();

        res.status(200).json(orderItems);
    } catch (error) {
        sendError(res, error, "Erro ao buscar itens do pedido.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID do Item do Pedido não informado."
        });
    }

    try {
        const orderItem = await OrderItemsRepository.findById(id);

        res.status(200).json(orderItem);
    } catch (error) {
        sendError(res, error, "Erro ao buscar item do pedido.");
    }
}

async function getByOrder(req: Request<{ orderId: string }>, res: Response) {
    const { orderId } = req.params;

    if (!orderId) {
        return res.status(400).json({
            message: "ID do Pedido não informado."
        });
    }

    try {
        const orderItems = await OrderItemsRepository.findByOrder(orderId);

        res.status(200).json(orderItems);
    } catch (error) {
        sendError(res, error, "Erro ao buscar itens do pedido.");
    }
}

async function create(req: Request, res: Response) {
    try {
        const orderItem = new OrderItem(req.body ?? {});

        const createdOrderItem = await OrderItemsRepository.create(orderItem);

        res.status(201).json(createdOrderItem);
    } catch (error) {
        sendError(res, error, "Erro ao criar item do pedido.", ORDER_OR_GAME_NOT_FOUND);
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const body = req.body ?? {};

    if (!id) {
        return res.status(400).json({
            message: "ID do Item do Pedido não informado."
        });
    }

    try {
        const orderItem = await OrderItemsRepository.findById(id);

        if (body.order_id !== undefined) {
            orderItem.changeOrder(body.order_id);
        }
        if (body.game_id !== undefined) {
            orderItem.changeGame(body.game_id);
        }
        if (body.quantity !== undefined) {
            orderItem.changeQuantity(body.quantity);
        }
        if (body.unit_price !== undefined) {
            orderItem.changeUnitPrice(body.unit_price);
        }

        const updatedOrderItem = await OrderItemsRepository.update(orderItem);

        res.status(200).json(updatedOrderItem);
    } catch (error) {
        sendError(res, error, "Erro ao atualizar item do pedido.", ORDER_OR_GAME_NOT_FOUND);
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID do Item do Pedido não informado."
        });
    }

    try {
        await OrderItemsRepository.remove(id);

        res.status(200).json({
            message: "Item do pedido removido com sucesso.",
        });
    } catch (error) {
        sendError(res, error, "Erro ao remover item do pedido.");
    }
}

export default {
    getAll,
    getById,
    getByOrder,
    create,
    update,
    remove
}
