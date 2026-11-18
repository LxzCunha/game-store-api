import type { Request, Response } from "express";
import OrdersRepository from "../repository/OrdersRepository.js";
import { Order } from "../models/Orders.js";
import { applyActive, sendError } from "./helpers.js";

const CUSTOMER_OR_SELLER_NOT_FOUND = {
    status: 400,
    message: "O cliente ou o vendedor informado não existe."
} as const;

async function getAll(req: Request, res: Response) {
    try {
        const orders = await OrdersRepository.findAll();

        res.status(200).json(orders);
    } catch (error) {
        sendError(res, error, "Erro ao buscar pedidos.");
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID do Pedido não informado."
        });
    }

    try {
        const order = await OrdersRepository.findById(id);

        res.status(200).json(order);
    } catch (error) {
        sendError(res, error, "Erro ao buscar pedido.");
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
        const orders = await OrdersRepository.findByCustomer(customerId);

        res.status(200).json(orders);
    } catch (error) {
        sendError(res, error, "Erro ao buscar pedidos do cliente.");
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
        const orders = await OrdersRepository.findBySeller(sellerId);

        res.status(200).json(orders);
    } catch (error) {
        sendError(res, error, "Erro ao buscar pedidos do vendedor.");
    }
}

async function create(req: Request, res: Response) {
    const body = req.body ?? {};

    try {
        const order = new Order(body);
        applyActive(order, body.active);

        const createdOrder = await OrdersRepository.create(order);

        res.status(201).json(createdOrder);
    } catch (error) {
        sendError(res, error, "Erro ao criar pedido.", CUSTOMER_OR_SELLER_NOT_FOUND);
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const body = req.body ?? {};

    if (!id) {
        return res.status(400).json({
            message: "ID do Pedido não informado."
        });
    }

    try {
        const order = await OrdersRepository.findById(id);

        if (body.customer_id !== undefined) {
            order.changeCustomer(body.customer_id);
        }
        if (body.seller_id !== undefined) {
            order.changeSeller(body.seller_id);
        }
        if (body.order_date !== undefined) {
            order.changeOrderDate(body.order_date);
        }
        if (body.status !== undefined) {
            order.changeStatus(body.status);
        }
        if (body.total !== undefined) {
            order.changeTotal(body.total);
        }

        applyActive(order, body.active);

        const updatedOrder = await OrdersRepository.update(order);

        res.status(200).json(updatedOrder);
    } catch (error) {
        sendError(res, error, "Erro ao atualizar pedido.", CUSTOMER_OR_SELLER_NOT_FOUND);
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "ID do Pedido não informado."
        });
    }

    try {
        await OrdersRepository.remove(id);

        res.status(200).json({
            message: "Pedido removido com sucesso.",
        });
    } catch (error) {
        sendError(res, error, "Erro ao remover pedido.", {
            status: 409,
            message: "Não é possível remover este pedido, pois ele está vinculado a um item pedido."
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
